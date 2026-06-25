import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

type InviteKind = 'student' | 'advisor';

interface StudentInvite {
  kind: 'student';
  id: string;
  token: string;
  advisor_id: string;
  student_id: string | null;
  email: string | null;
  name: string | null;
  expires_at: string | null;
  used_at: string | null;
}

interface AdvisorInvite {
  kind: 'advisor';
  id: string;
  token: string;
  admin_id: string;
  advisor_id: string | null;
  email: string | null;
  name: string | null;
  expires_at: string | null;
  used_at: string | null;
}

type Invite = StudentInvite | AdvisorInvite;

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('invite');

  const [invite, setInvite] = useState<Invite | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mode: InviteKind | null = invite ? invite.kind : null;

  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      return;
    }
    (async () => {
      // Check student_invites first
      const { data: studentRow } = await supabase
        .from('student_invites')
        .select('id, token, advisor_id, student_id, email, name, expires_at, used_at')
        .eq('token', inviteToken)
        .maybeSingle();

      if (studentRow) {
        const row = studentRow as any;
        if (row.used_at) {
          setInviteError('This registration link has already been used. Please log in instead.');
        } else if (row.expires_at && new Date(row.expires_at) < new Date()) {
          setInviteError('This registration link has expired. Please ask your consultant for a new one.');
        } else {
          setInvite({ ...row, kind: 'student' } as StudentInvite);
          if (row.email) setEmail(row.email);
          if (row.name) setFullName(row.name);
        }
        setInviteLoading(false);
        return;
      }

      // Fall back to advisor_invites
      const { data: advisorRow } = await supabase
        .from('advisor_invites' as any)
        .select('id, token, admin_id, advisor_id, email, name, expires_at, used_at')
        .eq('token', inviteToken)
        .maybeSingle();

      if (advisorRow) {
        const row = advisorRow as any;
        if (row.used_at) {
          setInviteError('This registration link has already been used. Please log in instead.');
        } else if (row.expires_at && new Date(row.expires_at) < new Date()) {
          setInviteError('This registration link has expired. Please ask your admin for a new one.');
        } else {
          setInvite({ ...row, kind: 'advisor' } as AdvisorInvite);
          if (row.email) setEmail(row.email);
          if (row.name) setFullName(row.name);
        }
        setInviteLoading(false);
        return;
      }

      setInviteError('This registration link is invalid or has been removed.');
      setInviteLoading(false);
    })();
  }, [inviteToken]);

  const heading = useMemo(() => {
    if (mode === 'student') return 'Create your student account';
    if (mode === 'advisor') return 'Create your consultant account';
    return 'Registration is by invite only';
  }, [mode]);

  const subheading = useMemo(() => {
    if (mode === 'student') return "You've been invited to join Primrose by your consultant.";
    if (mode === 'advisor') return "You've been invited to join Primrose by your IEC admin.";
    return 'Ask your consultant or admin to send you an invite link.';
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !invite) return;
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error('Please fill in name, email, and password.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const role = invite.kind === 'student' ? 'student' : 'consultant';
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: fullName.trim(), role },
        },
      });

      if (error || !data.user) {
        toast.error(error?.message ?? 'Could not create account.');
        setSubmitting(false);
        return;
      }

      // RLS on noga.students / noga.advisors blocks the freshly-signed-up
      // user from claiming their own row (chicken-and-egg). Delegate to a
      // SECURITY DEFINER RPC that validates the token server-side and does
      // the linkage + marks the invite consumed atomically.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          toast.error('Account created but could not sign in to finish setup. Please log in.');
          navigate('/login', { replace: true });
          return;
        }
      }

      const rpcName =
        invite.kind === 'student' ? 'claim_student_invite' : 'claim_advisor_invite';
      const { error: claimError } = await supabase.rpc(rpcName as any, {
        p_token: invite.token,
        p_full_name: fullName.trim(),
        p_email: email.trim(),
      });

      if (claimError) {
        toast.error(claimError.message || 'Could not link your invite.');
        setSubmitting(false);
        return;
      }

      toast.success('Welcome to Primrose.');
      navigate(invite.kind === 'student' ? '/student' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  if (inviteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-semibold text-rose-700">Link unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground">{inviteError}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!invite) {
    // No invite token at all → registration is invite-only.
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-mesh-violet p-6">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-md rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-[0_20px_60px_-20px_hsl(263_70%_50%/0.25)] backdrop-blur-xl animate-scale-in">
          <h1 className="text-2xl font-bold tracking-tight text-gradient-primary">{heading}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{subheading}</p>
          <Button asChild variant="outline" className="mt-6 rounded-xl press-soft">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isStudent = mode === 'student';

  return (
    <div className={`relative min-h-screen overflow-hidden bg-background ${isStudent ? 'bg-mesh-warm' : 'bg-mesh-violet'}`}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full blur-3xl animate-float ${isStudent ? 'bg-rose-400/25' : 'bg-violet-400/25'}`} />
        <div className={`absolute -top-20 right-0 h-[400px] w-[400px] rounded-full blur-3xl animate-float ${isStudent ? 'bg-amber-300/30' : 'bg-amber-300/30'}`} style={{ animationDelay: '1.5s' }} />
        <div className={`absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full blur-3xl animate-float ${isStudent ? 'bg-orange-300/20' : 'bg-rose-300/20'}`} style={{ animationDelay: '3s' }} />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="mb-7 flex flex-col items-center text-center animate-slide-up">
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl ${
              isStudent ? 'from-rose-500 to-amber-500 shadow-rose-500/30' : 'from-violet-600 to-indigo-700 shadow-violet-500/30'
            }`}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
            {isStudent ? <GraduationCap className="h-8 w-8 relative" /> : <Users className="h-8 w-8 relative" />}
          </div>
          <h1
            className="mt-5 text-3xl font-bold tracking-tight text-gradient-primary"
            style={{ fontFamily: 'Sora, Inter, sans-serif' }}
          >
            {heading}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`w-full rounded-3xl border border-white/60 bg-white/80 p-7 backdrop-blur-xl animate-slide-up stagger-2 ${
            isStudent
              ? 'shadow-[0_20px_60px_-20px_hsl(20_90%_50%/0.25)]'
              : 'shadow-[0_20px_60px_-20px_hsl(263_70%_50%/0.25)]'
          }`}
        >
          <GoogleSignInButton
            mode="signup"
            pendingInvite={{ token: invite.token, kind: invite.kind }}
          />

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className={`h-px flex-1 ${isStudent ? 'bg-rose-200/70' : 'bg-violet-200/70'}`} />
            or sign up with email
            <span className={`h-px flex-1 ${isStudent ? 'bg-rose-200/70' : 'bg-violet-200/70'}`} />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                disabled={submitting}
                className={`h-11 rounded-xl bg-white/70 transition-all focus-visible:bg-white ${
                  isStudent ? 'border-rose-200/70 focus-visible:border-rose-400' : 'border-violet-200/70 focus-visible:border-violet-400'
                }`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={submitting || !!invite?.email}
                className={`h-11 rounded-xl bg-white/70 transition-all focus-visible:bg-white ${
                  isStudent ? 'border-rose-200/70 focus-visible:border-rose-400' : 'border-violet-200/70 focus-visible:border-violet-400'
                }`}
              />
              {invite?.email ? (
                <p className="mt-1 text-xs text-muted-foreground">Pre-filled by your {isStudent ? 'consultant' : 'admin'}.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={submitting}
                className={`h-11 rounded-xl bg-white/70 transition-all focus-visible:bg-white ${
                  isStudent ? 'border-rose-200/70 focus-visible:border-rose-400' : 'border-violet-200/70 focus-visible:border-violet-400'
                }`}
              />
            </div>
          </div>

          <Button
            type="submit"
            className={`mt-7 w-full h-11 rounded-xl text-white transition-all press-soft ${
              isStudent
                ? 'bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35'
                : 'bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/35'
            }`}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className={`font-medium underline-offset-4 hover:underline transition-colors ${isStudent ? 'text-rose-700 hover:text-rose-900' : 'text-violet-700 hover:text-violet-900'}`}>
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
