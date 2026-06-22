import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export function GenerateInviteLinkButton({ studentId, studentName, studentEmail }: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in as a consultant to generate an invite.');
        return;
      }

      const { data: advisor, error: advisorErr } = await supabase
        .from('advisors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (advisorErr || !advisor) {
        toast.error('Your consultant profile is not linked yet. Contact an admin.');
        return;
      }

      const { data: invite, error: inviteErr } = await supabase
        .from('student_invites')
        .insert({
          advisor_id: advisor.id,
          student_id: studentId,
          email: studentEmail || null,
          name: studentName || null,
        })
        .select('token')
        .single();

      if (inviteErr || !invite) {
        toast.error(inviteErr?.message ?? 'Could not generate invite.');
        return;
      }

      const url = `${window.location.origin}/register?invite=${invite.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Registration link copied to clipboard.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      className="gap-1 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
      Invite link
    </Button>
  );
}
