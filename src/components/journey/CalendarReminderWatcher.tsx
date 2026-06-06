import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

const STORAGE_KEY = 'cal_reminders_fired_v1';

function loadFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveFired(state: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Watches upcoming calendar events for a student and fires an in-app toast
 * when an event's reminder window opens. Suppresses re-firing via localStorage.
 */
export function CalendarReminderWatcher({ studentId }: { studentId: string }) {
  const eventsRef = useRef<any[]>([]);

  const refresh = async () => {
    const horizonStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const horizonEnd = new Date(Date.now() + 14 * 86400000).toISOString();
    const { data } = await supabase
      .from('student_calendar_events' as any)
      .select('id,title,start_at,reminder_minutes_before,location,event_type')
      .eq('student_id', studentId)
      .not('reminder_minutes_before', 'is', null)
      .gte('start_at', horizonStart)
      .lte('start_at', horizonEnd);
    eventsRef.current = (data as any) || [];
  };

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel(`cal-watch-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_calendar_events',
          filter: `student_id=eq.${studentId}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const fired = loadFired();
      let changed = false;

      // GC old entries
      for (const k of Object.keys(fired)) {
        if (fired[k] < now - 86400000) {
          delete fired[k];
          changed = true;
        }
      }

      for (const ev of eventsRef.current) {
        if (ev.reminder_minutes_before == null) continue;
        const start = new Date(ev.start_at).getTime();
        const fireAt = start - ev.reminder_minutes_before * 60 * 1000;
        if (now >= fireAt && now < start + 60 * 60 * 1000 && !fired[ev.id]) {
          const minutesAway = Math.max(0, Math.round((start - now) / 60000));
          const whenLabel =
            minutesAway === 0
              ? 'now'
              : minutesAway < 60
                ? `in ${minutesAway} min`
                : `in ${Math.round(minutesAway / 60)} h`;
          toast(`${ev.title}`, {
            description: `Starts ${whenLabel}${ev.location ? ` · ${ev.location}` : ''}`,
            duration: 12000,
            icon: <Bell className="h-4 w-4" />,
          });
          fired[ev.id] = now;
          changed = true;
        }
      }
      if (changed) saveFired(fired);
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [studentId]);

  return null;
}
