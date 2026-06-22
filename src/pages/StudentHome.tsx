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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.kind === 'workspace') {
    return <Navigate to={`/students/${state.studentId}/workspace`} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-violet-200/60 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
        <h1 className="text-xl font-semibold">Your workspace isn&apos;t set up yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask your consultant to send you a fresh registration link, or to
          link your account to your existing student profile.
        </p>
      </div>
    </div>
  );
}
