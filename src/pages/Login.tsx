import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AppRole =
  | 'student'
  | 'consultant'
  | 'parent'
  | 'counselor'
  | 'admin'
  | 'iec_admin'
  | 'principal'
  | 'teacher';

const destinationFor = (role: AppRole | null, next: string | null): string => {
  if (next) return next;
  switch (role) {
    case 'iec_admin':
      return '/admin/consultants';
    case 'consultant':
    case 'admin':
      return '/dashboard';
    case 'student':
      return '/student';
    default:
      return '/';
  }
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        toast.error(error?.message ?? 'Invalid email or password.');
        setSubmitting(false);
        return;
      }

      const { data: roleRow } = await supabase
        .schema('public' as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      const role = (roleRow?.role as AppRole | undefined) ?? null;
      navigate(destinationFor(role, next), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign in.');
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-mesh-violet">
      {/* Soft animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-violet-400/25 blur-3xl animate-float" />
        <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-amber-300/30 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-rose-300/20 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="mb-7 flex flex-col items-center text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 animate-pulse-soft" />
            Welcome back
          </div>
          <h1
            className="mt-5 text-3xl font-bold tracking-tight text-gradient-primary"
            style={{ fontFamily: 'Sora, Inter, sans-serif' }}
          >
            Log in to Primrose
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl border border-white/60 bg-white/80 p-7 shadow-[0_20px_60px_-20px_hsl(263_70%_50%/0.25)] backdrop-blur-xl animate-slide-up stagger-2"
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={submitting}
                className="h-11 rounded-xl border-violet-200/70 bg-white/70 transition-all focus-visible:border-violet-400 focus-visible:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                disabled={submitting}
                className="h-11 rounded-xl border-violet-200/70 bg-white/70 transition-all focus-visible:border-violet-400 focus-visible:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-7 w-full h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/35 transition-all press-soft"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Log in
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-violet-700 hover:text-violet-900 hover:underline underline-offset-4 transition-colors">
              Sign up as a consultant
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
