import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { destinationFor, type AppRole } from '@/lib/auth-destination';
import { PENDING_INVITE_KEY, type PendingInvite } from '@/components/auth/GoogleSignInButton';

function readPendingInvite(): PendingInvite | null {
  try {
    const raw = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingInvite;
    if (!parsed?.token || (parsed.kind !== 'student' && parsed.kind !== 'advisor')) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const ranRef = useRef(false);
  const [status, setStatus] = useState<string>('Finishing sign-in…');

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      // Supabase-js auto-detects the OAuth response in the URL and persists the
      // session before we ever get here. Just ask for the result.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        toast.error(sessionError?.message ?? 'Sign-in failed.');
        navigate('/login', { replace: true });
        return;
      }

      const user = session.user;
      const pending = readPendingInvite();

      if (pending) {
        setStatus('Claiming your invite…');
        const rpc =
          pending.kind === 'advisor' ? 'claim_advisor_invite' : 'claim_student_invite';
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          '';
        const email = user.email ?? '';

        const { error: claimError } = await supabase.rpc(rpc as any, {
          p_token: pending.token,
          p_full_name: fullName,
          p_email: email,
        });

        // Always clear the pending invite so we don't loop.
        sessionStorage.removeItem(PENDING_INVITE_KEY);

        if (claimError) {
          toast.error(claimError.message ?? 'Could not redeem your invite.');
          await supabase.auth.signOut();
          navigate('/register?invite_required=1', { replace: true });
          return;
        }
      }

      // Resolve role and route.
      setStatus('Loading your workspace…');
      const { data: roleRow } = await supabase
        .schema('public' as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role = (roleRow?.role as AppRole | undefined) ?? null;

      // Invite-only gate: signInWithOAuth will silently CREATE an auth.users
      // row for an unknown Google email, and the handle_new_user trigger seeds
      // a default user_roles row — so a missing role isn't enough to detect
      // "unauthorized newcomer." Require an actual Noga identity row
      // (advisor / student / admin linked by user_id) when no invite is being
      // claimed in this same callback.
      if (!pending) {
        const [advisorRes, studentRes, adminRes] = await Promise.all([
          supabase.from('advisors').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('students').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('admins' as any).select('id').eq('user_id', user.id).maybeSingle(),
        ]);
        const hasNogaIdentity = !!(advisorRes.data || studentRes.data || adminRes.data);
        if (!hasNogaIdentity) {
          await supabase.auth.signOut();
          toast.error('No Primrose account found for this Google email. Please use your invite link to register.');
          navigate('/login', { replace: true });
          return;
        }
      }

      navigate(destinationFor(role, null), { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-mesh-violet">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-violet-400/25 blur-3xl animate-float" />
        <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-amber-300/30 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        <p className="mt-4 text-sm font-medium text-foreground">{status}</p>
        <p className="mt-1 text-xs text-muted-foreground">Hang tight — this only takes a moment.</p>
      </div>
    </div>
  );
}
