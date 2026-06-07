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

export function useActivityFeed(studentId: string | null | undefined, limit = 50) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from('activity_events')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (mounted) {
        setEvents((data as ActivityEvent[]) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`activity:${studentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events', filter: `student_id=eq.${studentId}` },
        (payload) => {
          setEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [studentId, limit]);

  return { events, loading };
}
