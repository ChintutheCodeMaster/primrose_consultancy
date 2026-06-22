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
  | 'principal'
  | 'teacher';

const destinationFor = (role: AppRole | null, next: string | null): string => {
  if (next) return next;
  switch (role) {
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
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/30 blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome back
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
            Log in to Primrose
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-violet-200/60 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Log in
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-violet-700 hover:underline">
              Sign up as a consultant
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
