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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Hi {displayName} 👋</h1>
          <p className="text-muted-foreground mt-1">
            You're in the <span className="font-medium text-foreground">{phase}</span> phase. Here's what's next.
          </p>
        </div>
        <WorkspacePresence studentId={studentId} side="student" className="mt-2" />
      </div>

      <JourneyProgress studentId={studentId} student={student} />

      <JourneyHomeCalendar studentId={studentId} onOpenCalendar={() => onNavigate('calendar')} />

      {/* Shared workspace */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <ActivityFeed studentId={studentId} viewerSide="student" limit={40} />
        <SharedNotepad studentId={studentId} side="student" />
      </div>





      {/* Next actions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Next up</h2>
            {allTasksCount > 3 && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
                See all {allTasksCount}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
          {next3.length === 0 ? (
            <p className="text-sm text-muted-foreground">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {next3.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
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
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Upcoming deadlines</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('colleges')}>
              All {terms.nounPlural} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines on the calendar yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {upcoming.map((c, i) => {
                const days = Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000);
                return (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="font-medium truncate">{c.college_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
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
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Latest from your consultant</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')}>
                Reply <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{latestMsg.body}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('lab')}
          className="text-left p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
        >
          <FlaskConical className="h-5 w-5 text-primary mb-2" />
          <div className="font-semibold">Writing Lab</div>
          <div className="text-sm text-muted-foreground">Ethical AI to help you think, not write for you.</div>
        </button>
        <button
          onClick={() => onNavigate('detector')}
          className="text-left p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
        >
          <ShieldCheck className="h-5 w-5 text-primary mb-2" />
          <div className="font-semibold">AI Detector</div>
          <div className="text-sm text-muted-foreground">Gut-check your drafts before submitting.</div>
        </button>
      </div>
    </div>
  );
}
