import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Link2, RefreshCw, Send, UserMinus, UserPlus, XCircle, Loader2 } from 'lucide-react';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';

interface Props {
  studentId: string;
  studentEmail?: string | null;
  studentName?: string | null;
}

type Invite = {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
};

type Status =
  | { kind: 'linked'; userId: string; userEmail: string }
  | { kind: 'pending'; invite: Invite }
  | { kind: 'expired'; invite: Invite }
  | { kind: 'none' };

export function AccountStatusPanel({ studentId, studentEmail, studentName }: Props) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: 'none' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: student }, { data: invites }] = await Promise.all([
      supabase.from('students').select('user_id').eq('id', studentId).maybeSingle(),
      supabase
        .from('student_invites')
        .select('id, token, created_at, expires_at, used_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
    ]);

    if (student?.user_id) {
      // Fall back to the student row's email as the displayed identity;
      // looking up auth.users.email requires service role.
      setStatus({
        kind: 'linked',
        userId: student.user_id,
        userEmail: studentEmail ?? '',
      });
      setLoading(false);
      return;
    }

    const list = (invites ?? []) as Invite[];
    const unused = list.find((i) => !i.used_at);
    if (unused) {
      const expired = unused.expires_at && new Date(unused.expires_at) < new Date();
      setStatus(expired ? { kind: 'expired', invite: unused } : { kind: 'pending', invite: unused });
    } else {
      setStatus({ kind: 'none' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const inviteUrl = (token: string) => `${window.location.origin}/register?invite=${token}`;

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(inviteUrl(token));
    toast.success('Registration link copied to clipboard.');
  };

  const generateInvite = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in as a consultant to send invites.');
        return;
      }
      const { data: advisor } = await supabase
        .from('advisors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!advisor) {
        toast.error('Your consultant profile is not linked yet. Contact an admin.');
        return;
      }
      const { data: invite, error } = await supabase
        .from('student_invites')
        .insert({
          advisor_id: advisor.id,
          student_id: studentId,
          email: studentEmail || null,
          name: studentName || null,
        })
        .select('id, token, created_at, expires_at, used_at')
        .single();

      if (error) {
        // 23505 = unique_violation (someone else already created an unused invite)
        if ((error as any).code === '23505') {
          toast.info('An active invite already exists for this student. Reloading.');
          await load();
          return;
        }
        toast.error(error.message ?? 'Could not generate invite.');
        return;
      }
      await navigator.clipboard.writeText(inviteUrl(invite!.token));
      toast.success('Invite created and link copied to clipboard.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('student_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error(error.message ?? 'Could not revoke invite.');
        return;
      }
      toast.success('Invite revoked.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resendInvite = async (oldId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      // Revoke the old one first so the unique index doesn't block the new insert.
      await supabase
        .from('student_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', oldId);
      await generateInvite();
    } finally {
      setBusy(false);
    }
  };

  const unlinkAccount = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ user_id: null })
        .eq('id', studentId);
      if (error) {
        toast.error(error.message ?? 'Could not unlink account.');
        return;
      }
      toast.success('Account unlinked. Send a fresh invite to relink.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Account Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : status.kind === 'linked' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Linked
              </Badge>
              <span className="text-sm text-muted-foreground">
                Account active{status.userEmail ? ` · ${status.userEmail}` : ''}
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <UserMinus className="h-3.5 w-3.5" /> Unlink account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink this student's account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The student will lose access to their workspace. Their auth user still exists,
                    but you'll need to send a fresh invite to relink them.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={unlinkAccount}>Unlink</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : status.kind === 'pending' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                <Clock className="h-3 w-3" /> Invite pending
              </Badge>
              <span className="text-sm text-muted-foreground">
                Sent {formatDistanceToNowStrict(new Date(status.invite.created_at))} ago
                {status.invite.expires_at &&
                  ` · expires in ${differenceInDays(new Date(status.invite.expires_at), new Date())} day${
                    differenceInDays(new Date(status.invite.expires_at), new Date()) === 1 ? '' : 's'
                  }`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => copyLink(status.invite.token)} className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Copy link
              </Button>
              <Button size="sm" variant="outline" onClick={() => resendInvite(status.invite.id)} disabled={busy} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Resend (new link)
              </Button>
              <Button size="sm" variant="outline" onClick={() => revokeInvite(status.invite.id)} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
                <XCircle className="h-3.5 w-3.5" /> Revoke
              </Button>
            </div>
          </div>
        ) : status.kind === 'expired' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> Invite expired
              </Badge>
              <span className="text-sm text-muted-foreground">
                Expired {formatDistanceToNowStrict(new Date(status.invite.expires_at!))} ago
              </span>
            </div>
            <Button size="sm" onClick={() => resendInvite(status.invite.id)} disabled={busy} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Generate new invite
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <UserPlus className="h-3 w-3" /> Not invited yet
              </Badge>
              <span className="text-sm text-muted-foreground">
                Student hasn't been invited to their workspace.
              </span>
            </div>
            <Button size="sm" onClick={generateInvite} disabled={busy} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send invite
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
