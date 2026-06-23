import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Resolution =
  | { kind: 'loading' }
  | { kind: 'workspace'; studentId: string }
  | { kind: 'missing' };

// Logged-in student landing. Looks up the noga.students row linked to the
// current auth user and redirects to that student's workspace. If the
// linkage hasn't been backfilled yet (e.g. legacy student created before
// auth went live), show a friendly fallback instead of routing nowhere.
export default function StudentHome() {
  const [state, setState] = useState<Resolution>({ kind: 'loading' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ kind: 'missing' });
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        setState({ kind: 'missing' });
      } else {
        setState({ kind: 'workspace', studentId: data.id });
      }
    })();
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh-warm">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Loading your journey</p>
        </div>
      </div>
    );
  }

  if (state.kind === 'workspace') {
    return <Navigate to={`/students/${state.studentId}/workspace`} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-mesh-warm p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-rose-400/20 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <div className="max-w-md rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-[0_20px_60px_-20px_hsl(20_90%_50%/0.25)] backdrop-blur-xl animate-scale-in">
        <h1 className="text-2xl font-bold tracking-tight text-gradient-primary">Your workspace isn&apos;t set up yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask your consultant to send you a fresh registration link, or to
          link your account to your existing student profile.
        </p>
      </div>
    </div>
  );
}
