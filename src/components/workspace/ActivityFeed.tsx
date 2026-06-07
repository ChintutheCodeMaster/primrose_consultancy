import { useMemo, useState } from 'react';
import { useActivityFeed, type ActivityEvent } from '@/hooks/useActivityFeed';
import {
  MessageSquare, FileText, MessageCircle, GraduationCap, ListChecks,
  Trophy, CalendarDays, Paperclip, Sparkles, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  studentId: string;
  viewerSide: 'consultant' | 'student';
  className?: string;
  limit?: number;
}

const KIND_META: Record<string, { label: string; icon: any; tone: string }> = {
  message:        { label: 'Messages',  icon: MessageSquare,  tone: 'bg-sky-100 text-sky-800' },
  essay_version:  { label: 'Essays',    icon: FileText,       tone: 'bg-indigo-100 text-indigo-800' },
  comment:        { label: 'Essays',    icon: MessageCircle,  tone: 'bg-indigo-100 text-indigo-800' },
  college:        { label: 'Colleges',  icon: GraduationCap,  tone: 'bg-violet-100 text-violet-800' },
  task:           { label: 'Tasks',     icon: ListChecks,     tone: 'bg-amber-100 text-amber-800' },
  acceptance:     { label: 'Wins',      icon: Trophy,         tone: 'bg-emerald-100 text-emerald-800' },
  calendar:       { label: 'Calendar',  icon: CalendarDays,   tone: 'bg-rose-100 text-rose-800' },
  file:           { label: 'Files',     icon: Paperclip,      tone: 'bg-slate-100 text-slate-800' },
};

const FILTERS = [
  { id: 'all', label: 'All', kinds: null as string[] | null },
  { id: 'messages', label: 'Messages', kinds: ['message'] },
  { id: 'essays', label: 'Essays', kinds: ['essay_version', 'comment'] },
  { id: 'colleges', label: 'Colleges', kinds: ['college'] },
  { id: 'tasks', label: 'Tasks', kinds: ['task'] },
  { id: 'wins', label: 'Wins', kinds: ['acceptance'] },
];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function actorLabel(actor: string, viewerSide: 'consultant' | 'student') {
  if (actor === 'system') return 'System';
  if (actor === viewerSide) return 'You';
  if (actor === 'consultant') return 'Consultant';
  if (actor === 'student') return 'Student';
  return actor;
}

export function ActivityFeed({ studentId, viewerSide, className, limit = 80 }: Props) {
  const { events, loading } = useActivityFeed(studentId, limit);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    if (!f?.kinds) return events;
    return events.filter((e) => f.kinds!.includes(e.kind));
  }, [events, filter]);

  return (
    <div className={cn('rounded-2xl border bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold">Activity</h3>
          <span className="text-xs text-muted-foreground">live</span>
          <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                filter === f.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading activity…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-emerald-600" />
            Nothing here yet — actions on either side will appear in real time.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((e) => <EventRow key={e.id} event={e} viewerSide={viewerSide} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, viewerSide }: { event: ActivityEvent; viewerSide: 'consultant' | 'student' }) {
  const meta = KIND_META[event.kind] ?? { label: event.kind, icon: Activity, tone: 'bg-muted text-foreground' };
  const Icon = meta.icon;
  const isYou = event.actor === viewerSide;
  return (
    <li className="flex gap-3 px-2 py-2.5">
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/90">{event.summary}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={cn('font-medium', isYou && 'text-emerald-700')}>{actorLabel(event.actor, viewerSide)}</span>
          <span>·</span>
          <span>{relTime(event.created_at)}</span>
        </div>
      </div>
    </li>
  );
}
