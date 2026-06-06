import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stage = {
  key: string;
  label: string;
  status: 'done' | 'active' | 'todo';
};

export function JourneyProgress({
  studentId,
  student,
  compact = false,
}: {
  studentId: string;
  student: any;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: extras }, { data: colleges }, { data: applied }] = await Promise.all([
        supabase.from('student_profile_extras').select('*').eq('student_id', studentId).maybeSingle(),
        supabase.from('student_colleges').select('id, status, locked_at, submitted_at, essays_status').eq('student_id', studentId),
        supabase.from('applied_universities').select('id, application_status').eq('student_id', studentId),
      ]);

      const onboarded = !!extras?.onboarded_at;
      const profileComplete = !!extras && (!!extras.gpa || !!extras.sat_score || !!extras.act_score) && (extras.intended_majors?.length || 0) > 0;
      const collegesList = colleges || [];
      const listLocked = collegesList.some((c) => c.locked_at) || collegesList.length >= 6;
      const essaysStarted = collegesList.some((c) => c.essays_status && c.essays_status !== 'not_started');
      const submitted = (applied || []).filter((a: any) => ['submitted', 'accepted', 'rejected', 'waitlisted'].includes(a.application_status));
      const anySubmitted = submitted.length > 0;
      const decisionsIn = (applied || []).some((a: any) => ['accepted', 'rejected', 'waitlisted'].includes(a.application_status));
      const enrolled = student?.status === 'enrolled' || student?.status === 'graduated';

      const raw: Stage[] = [
        { key: 'onboarding', label: 'Onboarded', status: onboarded ? 'done' : 'active' },
        { key: 'profile', label: 'Profile complete', status: profileComplete ? 'done' : onboarded ? 'active' : 'todo' },
        { key: 'list', label: 'College list', status: listLocked ? 'done' : profileComplete ? 'active' : 'todo' },
        { key: 'essays', label: 'Essays', status: essaysStarted ? (anySubmitted ? 'done' : 'active') : listLocked ? 'active' : 'todo' },
        { key: 'submitted', label: 'Applications', status: anySubmitted ? 'done' : essaysStarted ? 'active' : 'todo' },
        { key: 'decisions', label: 'Decisions', status: decisionsIn ? 'done' : anySubmitted ? 'active' : 'todo' },
        { key: 'enrolled', label: 'Enrolled', status: enrolled ? 'done' : decisionsIn ? 'active' : 'todo' },
      ];

      // Ensure only first non-done is "active"
      let foundActive = false;
      const final = raw.map((s) => {
        if (s.status === 'done') return s;
        if (!foundActive) {
          foundActive = true;
          return { ...s, status: 'active' as const };
        }
        return { ...s, status: 'todo' as const };
      });

      const done = final.filter((s) => s.status === 'done').length;
      setPct(Math.round((done / final.length) * 100));
      setStages(final);
      setLoading(false);
    })();
  }, [studentId, student?.status]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading progress…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className={cn('p-4 sm:p-5 space-y-4', compact && 'p-3 space-y-3')}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Admissions cycle</h3>
          <span className="text-sm font-medium text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stages.map((s) => (
            <li
              key={s.key}
              className={cn(
                'flex flex-col items-start gap-1 p-2 rounded-md border text-xs',
                s.status === 'done' && 'bg-primary/5 border-primary/30',
                s.status === 'active' && 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800',
                s.status === 'todo' && 'bg-muted/30 border-muted',
              )}
            >
              <div className="flex items-center gap-1">
                {s.status === 'done' ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className={cn('h-3.5 w-3.5', s.status === 'active' ? 'text-amber-600' : 'text-muted-foreground')} />
                )}
                <span className="font-medium">{s.label}</span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
