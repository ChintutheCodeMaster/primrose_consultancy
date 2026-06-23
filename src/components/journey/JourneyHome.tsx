import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { JourneyHomeCalendar } from '@/components/journey/JourneyHomeCalendar';
import { ActivityFeed } from '@/components/workspace/ActivityFeed';
import { SharedNotepad } from '@/components/workspace/SharedNotepad';
import { WorkspacePresence } from '@/components/workspace/WorkspacePresence';
import { getProgramTerms } from '@/lib/programTerms';

const PHASE_LABEL_BASE: Record<string, string> = {
  discovery: 'Discovery',
  applications: 'Applications',
  decisions: 'Decisions',
};

export function JourneyHome({
  student,
  studentId,
  onNavigate,
}: {
  student: any;
  studentId: string;
  onNavigate: (s: any) => void;
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [latestMsg, setLatestMsg] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: c }, { data: convs }] = await Promise.all([
        supabase
          .from('student_tasks')
          .select('*')
          .eq('student_id', studentId)
          .neq('status', 'done')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(20),
        supabase
          .from('student_colleges')
          .select('college_name, deadline, status, list_bucket')
          .eq('student_id', studentId),
        supabase
          .from('conversations' as any)
          .select('id, advisor_id')
          .eq('student_id', studentId),
      ]);
      setTasks(t || []);
      setColleges(c || []);

      const convRows = ((convs as any[]) ?? []) as Array<{ id: string; advisor_id: string }>;
      if (convRows.length === 0) {
        setLatestMsg(null);
        return;
      }
      const advisorIds = convRows.map((c) => c.advisor_id);
      const { data: advisorRows } = await supabase
        .from('advisors')
        .select('id, user_id')
        .in('id', advisorIds);
      const advisorUserIds = ((advisorRows as any[]) ?? [])
        .map((a) => a.user_id)
        .filter(Boolean);
      if (advisorUserIds.length === 0) {
        setLatestMsg(null);
        return;
      }
      const { data: msg } = await supabase
        .from('messages' as any)
        .select('id, content, created_at, sender_id, conversation_id')
        .in('conversation_id', convRows.map((c) => c.id))
        .in('sender_id', advisorUserIds)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = msg as any;
      setLatestMsg(row ? { body: row.content, created_at: row.created_at } : null);
    })();
  }, [studentId]);

  const allTasksCount = tasks.length;
  const next3 = tasks.slice(0, 3);
  const upcoming = colleges
    .filter((c) => c.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const displayName = student.preferred_name || (student.name || '').split(' ')[0] || 'there';
  const terms = getProgramTerms(student.degree_type);
  const PHASE_LABEL: Record<string, string> = { ...PHASE_LABEL_BASE, list: terms.listPhaseLabel };
  const phase = PHASE_LABEL[student.phase] || PHASE_LABEL.discovery;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-rose-50/40 to-amber-50/40 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_30px_-12px_hsl(20_90%_50%/0.18)] animate-slide-up">
        <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full bg-rose-300/30 blur-3xl animate-float" />
        <div className="absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-amber-300/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-rose-200/60 px-3 py-1 text-xs font-medium text-rose-700 mb-3 backdrop-blur">
              <Sparkles className="h-3 w-3" /> {phase} phase
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
              Hi {displayName} <span className="inline-block animate-float">👋</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              Here's what's next on your journey.
            </p>
          </div>
          <WorkspacePresence studentId={studentId} side="student" className="mt-2" />
        </div>
      </div>

      <div className="animate-slide-up stagger-1"><JourneyProgress studentId={studentId} student={student} /></div>

      <div className="animate-slide-up stagger-2"><JourneyHomeCalendar studentId={studentId} onOpenCalendar={() => onNavigate('calendar')} /></div>

      {/* Shared workspace */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px] animate-slide-up stagger-3">
        <ActivityFeed studentId={studentId} viewerSide="student" limit={40} />
        <SharedNotepad studentId={studentId} side="student" />
      </div>


      {/* Next actions */}
      <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg tracking-tight">Next up</h2>
            {allTasksCount > 3 && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')} className="group">
                See all {allTasksCount}
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            )}
          </div>
          {next3.length === 0 ? (
            <p className="text-sm text-muted-foreground">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {next3.map((t, i) => (
                <li
                  key={t.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-rose-100/60 bg-gradient-to-r from-rose-50/40 to-transparent hover:from-rose-50 transition-colors animate-slide-up-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    {t.due_date && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        Due {new Date(t.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg tracking-tight">Upcoming deadlines</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('colleges')} className="group">
              All {terms.nounPlural} <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines on the calendar yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {upcoming.map((c, i) => {
                const days = Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000);
                const urgent = days >= 0 && days <= 7;
                return (
                  <div
                    key={i}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={`p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md animate-slide-up-sm ${
                      urgent
                        ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-rose-50'
                        : 'border-violet-100/60 bg-gradient-to-br from-violet-50/40 to-transparent hover:from-violet-50'
                    }`}
                  >
                    <div className="font-medium truncate">{c.college_name}</div>
                    <div className={`text-xs mt-0.5 ${urgent ? 'text-amber-700 font-medium' : 'text-muted-foreground'}`}>
                      {new Date(c.deadline).toLocaleDateString()} · {days >= 0 ? `${days} days` : `${-days} days ago`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultant note */}
      {latestMsg && (
        <Card className="card-lift rounded-2xl border-white/60 bg-gradient-to-br from-violet-50/60 to-white/80 backdrop-blur animate-slide-up stagger-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg tracking-tight">Latest from your consultant</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')} className="group">
                Reply <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{latestMsg.body}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3 animate-slide-up stagger-6">
        <button
          onClick={() => onNavigate('lab')}
          className="group text-left p-5 rounded-2xl border border-white/60 bg-white/80 backdrop-blur card-lift press-soft"
        >
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25 mb-3 transition-transform group-hover:scale-110">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="font-semibold tracking-tight">Writing Lab</div>
          <div className="text-sm text-muted-foreground mt-0.5">Ethical AI to help you think, not write for you.</div>
        </button>
        <button
          onClick={() => onNavigate('detector')}
          className="group text-left p-5 rounded-2xl border border-white/60 bg-white/80 backdrop-blur card-lift press-soft"
        >
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 mb-3 transition-transform group-hover:scale-110">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="font-semibold tracking-tight">AI Detector</div>
          <div className="text-sm text-muted-foreground mt-0.5">Gut-check your drafts before submitting.</div>
        </button>
      </div>
    </div>
  );
}
