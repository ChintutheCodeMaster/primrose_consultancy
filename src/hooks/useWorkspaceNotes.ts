import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWorkspaceNotes(studentId: string | null | undefined, side: 'consultant' | 'student') {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const localEditRef = useRef(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('student_workspace_notes')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      if (!mounted) return;
      setBody(data?.body ?? '');
      setSavedAt(data?.updated_at ?? null);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`notes:${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_workspace_notes', filter: `student_id=eq.${studentId}` },
        (payload) => {
          if (localEditRef.current) return; // ignore our own writes echoing back
          const row = payload.new as { body?: string; updated_at?: string; updated_by?: string };
          if (row.updated_by === side) return;
          if (typeof row.body === 'string') setBody(row.body);
          if (row.updated_at) setSavedAt(row.updated_at);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [studentId, side]);

  const update = (next: string) => {
    setBody(next);
    if (!studentId) return;
    localEditRef.current = true;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from('student_workspace_notes')
        .upsert({ student_id: studentId, body: next, updated_by: side }, { onConflict: 'student_id' })
        .select()
        .maybeSingle();
      if (data?.updated_at) setSavedAt(data.updated_at);
      setTimeout(() => { localEditRef.current = false; }, 250);
    }, 500);
  };

  return { body, update, loading, savedAt };
}
