import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Invite {
  id: string;
  token: string;
  advisor_id: string;
  student_id: string | null;
  email: string | null;
  name: string | null;
  expires_at: string | null;
  used_at: string | null;
}

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

  const mode: 'student' | 'consultant' = inviteToken ? 'student' : 'consultant';

  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      const { data, error } = await supabase
        .from('student_invites')
        .select('id, token, advisor_id, student_id, email, name, expires_at, used_at')
        .eq('token', inviteToken)
        .maybeSingle();

      if (error || !data) {
        setInviteError('This registration link is invalid or has been removed.');
      } else if (data.used_at) {
        setInviteError('This registration link has already been used. Please log in instead.');
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setInviteError('This registration link has expired. Please ask your consultant for a new one.');
      } else {
        setInvite(data as Invite);
        if (data.email) setEmail(data.email);
        if (data.name) setFullName(data.name);
      }
      setInviteLoading(false);
    })();
  }, [inviteToken]);

  const heading = useMemo(() => {
    if (mode === 'student') return 'Create your student account';
    return 'Create your consultant account';
  }, [mode]);

  const subheading = useMemo(() => {
    if (mode === 'student') return "You've been invited to join Primrose by your consultant.";
    return 'Sign up to access your Primrose CRM, AI strategist, and student workspace.';
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
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
      const role = mode === 'student' ? 'student' : 'consultant';
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

      const userId = data.user.id;

      // Client-side follow-up insert into noga.* (Option 1: trigger stays lean)
      if (mode === 'student' && invite) {
        if (invite.student_id) {
          await supabase
            .from('students')
            .update({ user_id: userId })
            .eq('id', invite.student_id);
        } else {
          await supabase.from('students').insert({
            name: fullName.trim(),
            email: email.trim(),
            user_id: userId,
            advisor_id: invite.advisor_id,
            status: 'active',
          });
        }

        await supabase
          .from('student_invites')
          .update({ used_at: new Date().toISOString(), used_by_user_id: userId })
          .eq('id', invite.id);
      } else if (mode === 'consultant') {
        await supabase.from('advisors').insert({
          name: fullName.trim(),
          email: email.trim(),
          user_id: userId,
          is_active: true,
        });
      }

      if (data.session) {
        toast.success('Welcome to Primrose.');
        navigate(mode === 'student' ? '/student' : '/dashboard', { replace: true });
      } else {
        toast.success('Account created. Please check your email to confirm, then log in.');
        navigate('/login', { replace: true });
      }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/30 blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mode === 'student' ? 'from-rose-500 to-amber-500' : 'from-violet-600 to-indigo-600'} text-white shadow-lg`}>
            {mode === 'student' ? <GraduationCap className="h-7 w-7" /> : <Users className="h-7 w-7" />}
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
            {heading}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-violet-200/60 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={submitting || !!invite?.email}
              />
              {invite?.email ? (
                <p className="mt-1 text-xs text-muted-foreground">Pre-filled by your consultant.</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={submitting}
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet-700 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
