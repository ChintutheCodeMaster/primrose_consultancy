import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { JourneyProgress } from '@/components/journey/JourneyProgress';

export function MissionControl({ studentId, studentName }: { studentId: string; studentName?: string }) {
  const [student, setStudent] = useState<any>(null);
  const [nextDeadline, setNextDeadline] = useState<{ title: string; date: Date } | null>(null);
  const [lastDraft, setLastDraft] = useState<{ title: string; at: Date } | null>(null);
  const [lastMsg, setLastMsg] = useState<{ author: string; at: Date } | null>(null);
  const [nextMeeting, setNextMeeting] = useState<{ title: string; at: Date } | null>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString();
      const [studentRes, task, version, msg, meeting] = await Promise.all([
        supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('student_tasks').select('title, due_date').eq('student_id', studentId).eq('status', 'open').gte('due_date', today.slice(0, 10)).order('due_date').limit(1).maybeSingle(),
        supabase.from('student_document_versions').select('created_at, document_id, student_documents_v2!inner(title, student_id)').eq('student_documents_v2.student_id', studentId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('student_messages').select('author, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('student_calendar_events').select('title, start_at').eq('student_id', studentId).gte('start_at', today).order('start_at').limit(1).maybeSingle(),
      ]);
      setStudent(studentRes.data);
      if (task.data?.due_date) setNextDeadline({ title: task.data.title, date: new Date(task.data.due_date) });
      if (version.data?.created_at) setLastDraft({ title: (version.data as any).student_documents_v2?.title || 'Essay', at: new Date(version.data.created_at) });
      if (msg.data?.created_at) setLastMsg({ author: msg.data.author || 'system', at: new Date(msg.data.created_at) });
      if (meeting.data?.start_at) setNextMeeting({ title: meeting.data.title || 'Meeting', at: new Date(meeting.data.start_at) });
    })();
  }, [studentId]);


  return (
    <div className="rounded-2xl border bg-gradient-to-br from-violet-50/60 via-white to-sky-50/60 p-5 sm:p-6 shadow-sm">
      {/* Status pills */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Pill icon={AlertCircle} tone="rose" label="Next deadline"
          value={nextDeadline ? nextDeadline.title : 'Nothing due'}
          meta={nextDeadline ? format(nextDeadline.date, 'MMM d') : undefined} />
        <Pill icon={FileText} tone="violet" label="Latest draft"
          value={lastDraft ? lastDraft.title : 'No drafts yet'}
          meta={lastDraft ? formatDistanceToNow(lastDraft.at, { addSuffix: true }) : undefined} />
        <Pill icon={MessageSquare} tone="emerald" label="Last message"
          value={lastMsg ? lastMsg.author : 'No messages yet'}
          meta={lastMsg ? formatDistanceToNow(lastMsg.at, { addSuffix: true }) : undefined} />
        <Pill icon={Calendar} tone="amber" label="Next meeting"
          value={nextMeeting ? nextMeeting.title : 'No upcoming meeting'}
          meta={nextMeeting ? format(nextMeeting.at, 'MMM d, p') : undefined} />
      </div>

      {/* Pipeline */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>Pipeline</span>
          <span className="font-semibold text-violet-700">{stage}</span>
        </div>
        <div className="relative">
          <div className="absolute left-3 right-3 top-3 h-0.5 bg-border" />
          <div
            className="absolute left-3 top-3 h-0.5 bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
            style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - ${currentIdx === 0 ? 0 : 0}px)` }}
          />
          <ol className="relative flex justify-between">
            {STAGES.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <li key={s} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={
                      'flex h-6 w-6 items-center justify-center rounded-full border-2 transition ' +
                      (active
                        ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/30'
                        : done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border bg-background text-muted-foreground')
                    }
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </span>
                  <span className={'text-[11px] sm:text-xs font-medium ' + (active ? 'text-foreground' : 'text-muted-foreground')}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Pill({
  icon: Icon, label, value, meta, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; meta?: string;
  tone: 'rose' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    rose: 'bg-rose-100 text-rose-600',
    violet: 'bg-violet-100 text-violet-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-700',
  } as const;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>
    </div>
  );
}
