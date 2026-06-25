import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export type PendingInvite = {
  token: string;
  kind: 'student' | 'advisor';
};

export const PENDING_INVITE_KEY = 'noga.pending_invite';

interface Props {
  mode: 'login' | 'signup';
  pendingInvite?: PendingInvite;
}

// Inline Google "G" mark — official 4-color palette
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.32A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.32z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.32C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleSignInButton({ mode, pendingInvite }: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (pendingInvite) {
        sessionStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(pendingInvite));
      } else {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        toast.error(error.message ?? 'Could not start Google sign-in.');
        setBusy(false);
      }
      // On success the browser navigates away; no further action needed.
    } catch (err) {
      sessionStorage.removeItem(PENDING_INVITE_KEY);
      toast.error(err instanceof Error ? err.message : 'Could not start Google sign-in.');
      setBusy(false);
    }
  };

  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={busy}
      className="w-full h-11 rounded-xl bg-white/90 border-violet-200/70 text-foreground hover:bg-white transition-all press-soft"
    >
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleMark className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
