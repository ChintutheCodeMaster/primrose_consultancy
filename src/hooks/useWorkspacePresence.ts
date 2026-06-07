import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWorkspacePresence(studentId: string | null | undefined, side: 'consultant' | 'student') {
  const [otherOnline, setOtherOnline] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    const other = side === 'consultant' ? 'student' : 'consultant';
    const channel = supabase.channel(`presence:student:${studentId}`, {
      config: { presence: { key: side } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOtherOnline(Boolean(state[other]?.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ side, at: new Date().toISOString() });
          // also persist last-seen for unread math
          await supabase
            .from('workspace_presence_state')
            .upsert({ student_id: studentId, side, last_seen_at: new Date().toISOString() }, { onConflict: 'student_id,side' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, side]);

  return { otherOnline };
}
