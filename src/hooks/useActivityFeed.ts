import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityEvent {
  id: string;
  student_id: string;
  actor: string;
  kind: string;
  ref_table: string | null;
  ref_id: string | null;
  summary: string;
  payload: Record<string, unknown>;
  created_at: string;
}

type EssayRow = {
  id: string;
  student_id: string;
  essay_title: string;
  status: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

// Synthesizes activity events from essay_feedback rows so the Activity feed
// reflects the in-app essay flow without requiring writes to activity_events.
// Each essay row may produce up to two synthetic events: "created" (essay_version
// kind so it groups with the rest of the essay activity in the UI filter)
// and "sent" (comment kind for review-loop visibility).
const synthesizeFromEssays = (rows: EssayRow[]): ActivityEvent[] => {
  const out: ActivityEvent[] = [];
  for (const r of rows) {
    out.push({
      id: `essay-created-${r.id}`,
      student_id: r.student_id,
      actor: 'student',
      kind: 'essay_version',
      ref_table: 'essay_feedback',
      ref_id: r.id,
      summary: `Essay drafted: "${r.essay_title}"`,
      payload: { status: r.status },
      created_at: r.created_at,
    });
    if (r.sent_at) {
      out.push({
        id: `essay-sent-${r.id}`,
        student_id: r.student_id,
        actor: 'consultant',
        kind: 'comment',
        ref_table: 'essay_feedback',
        ref_id: r.id,
        summary: `Feedback sent on "${r.essay_title}"`,
        payload: { status: r.status },
        created_at: r.sent_at,
      });
    } else if (r.updated_at && r.updated_at !== r.created_at) {
      out.push({
        id: `essay-updated-${r.id}`,
        student_id: r.student_id,
        actor: 'student',
        kind: 'essay_version',
        ref_table: 'essay_feedback',
        ref_id: r.id,
        summary: `Essay updated: "${r.essay_title}"`,
        payload: { status: r.status },
        created_at: r.updated_at,
      });
    }
  }
  return out;
};

export function useActivityFeed(studentId: string | null | undefined, limit = 50) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setLoading(true);

    const load = async () => {
      const [eventsRes, essaysRes] = await Promise.all([
        supabase
          .from('activity_events')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('essay_feedback' as any)
          .select('id, student_id, essay_title, status, created_at, updated_at, sent_at')
          .eq('student_id', studentId)
          .order('updated_at', { ascending: false })
          .limit(limit),
      ]);

      const baseEvents = (eventsRes.data as ActivityEvent[]) ?? [];
      const essayEvents = synthesizeFromEssays(((essaysRes.data as any[]) ?? []) as EssayRow[]);

      const merged = [...baseEvents, ...essayEvents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      if (mounted) {
        setEvents(merged);
        setLoading(false);
      }
    };

    load();

    const activityChannel = supabase
      .channel(`activity:${studentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events', filter: `student_id=eq.${studentId}` },
        (payload) => {
          setEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    const essayChannel = supabase
      .channel(`activity-essays:${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'noga', table: 'essay_feedback', filter: `student_id=eq.${studentId}` },
        () => { load(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(essayChannel);
    };
  }, [studentId, limit]);

  return { events, loading };
}
