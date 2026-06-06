import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type EventRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean | null;
  event_type: string;
  location: string | null;
};

// Vibrant palette — gradient bg + matching dot/ring for each type
const TYPE_STYLE: Record<
  string,
  { label: string; pill: string; dot: string; ring: string; soft: string }
> = {
  meeting: {
    label: 'Meeting',
    pill: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white',
    dot: 'bg-sky-500',
    ring: 'ring-sky-400',
    soft: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
  deadline: {
    label: 'Deadline',
    pill: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
    dot: 'bg-rose-500',
    ring: 'ring-rose-400',
    soft: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  },
  test: {
    label: 'Test',
    pill: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400',
    soft: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  reminder: {
    label: 'Reminder',
    pill: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white',
    dot: 'bg-violet-500',
    ring: 'ring-violet-400',
    soft: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
  other: {
    label: 'Other',
    pill: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-400',
    soft: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
};

const styleFor = (t: string) => TYPE_STYLE[t] || TYPE_STYLE.other;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function monthMatrix(anchor: Date) {
  // returns 6 rows × 7 days, starting Sunday
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function JourneyHomeCalendar({
  studentId,
  onOpenCalendar,
}: {
  studentId: string;
  onOpenCalendar: () => void;
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('student_calendar_events' as any)
        .select('id, title, start_at, end_at, all_day, event_type, location')
        .eq('student_id', studentId)
        .order('start_at', { ascending: true });
      setEvents(((data as any) || []) as EventRow[]);
    })();
  }, [studentId]);

  const days = useMemo(() => monthMatrix(anchor), [anchor]);
  const today = new Date();

  const byDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const d = new Date(e.start_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const selectedEvents = byDay.get(keyOf(selected)) || [];

  const monthLabel = anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-primary/5 via-background to-fuchsia-500/5">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-white grid place-items-center shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold leading-tight">Your month at a glance</h2>
              <p className="text-xs text-muted-foreground">{monthLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const now = new Date();
                setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelected(now);
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs ml-1"
              onClick={onOpenCalendar}
            >
              Open <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === anchor.getMonth();
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            const evs = byDay.get(keyOf(d)) || [];
            const shown = evs.slice(0, 2);
            const extra = evs.length - shown.length;

            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={cn(
                  'group relative min-h-[64px] sm:min-h-[72px] rounded-lg p-1.5 text-left transition-all border',
                  inMonth ? 'bg-card hover:bg-muted/60' : 'bg-muted/20 text-muted-foreground/70',
                  isToday && 'ring-2 ring-primary/60 border-primary/40',
                  isSel && !isToday && 'ring-2 ring-fuchsia-400/60 border-fuchsia-400/40',
                  !isToday && !isSel && 'border-transparent',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums grid place-items-center h-5 w-5 rounded-full',
                      isToday && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {evs.length > 0 && !shown.length && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {shown.map((e) => {
                    const s = styleFor(e.event_type);
                    return (
                      <div
                        key={e.id}
                        className={cn(
                          'truncate text-[10px] leading-tight px-1.5 py-0.5 rounded-md shadow-sm',
                          s.pill,
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    );
                  })}
                  {extra > 0 && (
                    <div className="text-[10px] text-muted-foreground pl-1">+{extra} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          {Object.entries(TYPE_STYLE).map(([k, s]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
              {s.label}
            </span>
          ))}
        </div>

        {/* Selected day details */}
        <div className="rounded-xl border bg-background/60 backdrop-blur p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              {selected.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing scheduled — enjoy the breathing room.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedEvents.map((e) => {
                const s = styleFor(e.event_type);
                const start = new Date(e.start_at);
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card/80"
                  >
                    <span className={cn('h-8 w-1.5 rounded-full', s.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{e.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>
                          {e.all_day
                            ? 'All day'
                            : start.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                        </span>
                        {e.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        s.soft,
                      )}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
