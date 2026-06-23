import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Link2, RefreshCw, Send, XCircle, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Advisor {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean | null;
  user_id: string | null;
  admin_id: string | null;
  created_at: string;
  student_count?: number;
}

interface Invite {
  id: string;
  token: string;
  email: string | null;
  name: string | null;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

export default function AdminConsultants() {
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const inviteUrl = (token: string) => `${window.location.origin}/register?invite=${token}`;

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAdminError('Not signed in.');
        setLoading(false);
        return;
      }
      const { data: admin } = await supabase
        .from('admins' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      const aId = (admin as any)?.id ?? null;
      if (!aId) {
        setAdminError(
          'Your admin profile is not provisioned in noga.admins. Ask the system owner to seed your admin row.',
        );
        setLoading(false);
        return;
      }
      setAdminId(aId);

      const [{ data: advisorRows }, { data: inviteRows }] = await Promise.all([
        supabase
          .from('advisors')
          .select('id, name, email, is_active, user_id, admin_id, created_at')
          .eq('admin_id', aId as any)
          .order('created_at', { ascending: false }),
        supabase
          .from('advisor_invites' as any)
          .select('id, token, email, name, expires_at, used_at, created_at')
          .eq('admin_id', aId)
          .order('created_at', { ascending: false }),
      ]);

      const list = ((advisorRows ?? []) as any[]) as Advisor[];
      // Fetch student counts in one go
      if (list.length) {
        const ids = list.map((a) => a.id);
        const { data: counts } = await supabase
          .from('students')
          .select('advisor_id')
          .in('advisor_id', ids);
        const tally = new Map<string, number>();
        (counts ?? []).forEach((row: any) => {
          tally.set(row.advisor_id, (tally.get(row.advisor_id) ?? 0) + 1);
        });
        list.forEach((a) => {
          a.student_count = tally.get(a.id) ?? 0;
        });
      }

      setAdvisors(list);
      setInvites((inviteRows ?? []) as Invite[]);
      setLoading(false);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to load.');
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingInvites = useMemo(() => invites.filter((i) => !i.used_at), [invites]);

  const createInvite = async () => {
    if (!adminId || submitting) return;
    setSubmitting(true);
    try {
      const { data: invite, error } = await supabase
        .from('advisor_invites' as any)
        .insert({
          admin_id: adminId,
          email: inviteEmail.trim() || null,
          name: inviteName.trim() || null,
        } as any)
        .select('id, token, email, name, expires_at, used_at, created_at')
        .single();
      if (error || !invite) {
        toast.error(error?.message ?? 'Could not create invite.');
        return;
      }
      await navigator.clipboard.writeText(inviteUrl((invite as any).token));
      toast.success('Invite created and link copied to clipboard.');
      setInviteName('');
      setInviteEmail('');
      setDialogOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(inviteUrl(token));
    toast.success('Link copied to clipboard.');
  };

  const revokeInvite = async (id: string) => {
    setBusyInviteId(id);
    try {
      const { error } = await supabase
        .from('advisor_invites' as any)
        .update({ used_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) {
        toast.error(error.message ?? 'Could not revoke invite.');
        return;
      }
      toast.success('Invite revoked.');
      await load();
    } finally {
      setBusyInviteId(null);
    }
  };

  const resendInvite = async (oldId: string, email: string | null, name: string | null) => {
    if (!adminId) return;
    setBusyInviteId(oldId);
    try {
      await supabase
        .from('advisor_invites' as any)
        .update({ used_at: new Date().toISOString() } as any)
        .eq('id', oldId);
      const { data: invite } = await supabase
        .from('advisor_invites' as any)
        .insert({ admin_id: adminId, email, name } as any)
        .select('token')
        .single();
      if ((invite as any)?.token) {
        await navigator.clipboard.writeText(inviteUrl((invite as any).token));
        toast.success('New invite created and copied.');
      }
      await load();
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-violet-50/40 to-amber-50/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_30px_-12px_hsl(263_70%_50%/0.18)] animate-slide-up">
          <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full bg-violet-300/25 blur-3xl animate-float" />
          <div className="absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">IEC Admin</p>
              <h1
                className="mt-2 text-3xl font-bold tracking-tight text-gradient-primary"
                style={{ fontFamily: 'Sora, Inter, sans-serif' }}
              >
                Consultants
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Invite and manage consultants for your IEC. Each consultant you invite will be linked to you on signup.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!adminId}
                  className="gap-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all press-soft"
                >
                  <UserPlus className="h-4 w-4" /> Invite consultant
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a consultant</DialogTitle>
                <DialogDescription>
                  We'll create a registration link. Share it with the consultant — they'll sign up and be linked to your IEC.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="iName">Name (optional)</Label>
                  <Input id="iName" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <Label htmlFor="iEmail">Email (optional)</Label>
                  <Input
                    id="iEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Pre-fills the consultant's email on the registration form.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={createInvite} disabled={submitting} className="gap-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 press-soft">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Create invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground animate-fade-in">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : adminError ? (
          <Card className="rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-fade-in">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">{adminError}</CardContent>
          </Card>
        ) : (
          <>
            <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-1">
              <CardHeader>
                <CardTitle className="text-base tracking-tight flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow shadow-violet-500/25">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Your consultants
                  <span className="ml-1 inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-xs font-semibold">{advisors.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {advisors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No consultants yet. Use "Invite consultant" to send a registration link.
                  </p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {advisors.map((a, i) => (
                      <div
                        key={a.id}
                        style={{ animationDelay: `${i * 50}ms` }}
                        className="flex items-center justify-between py-3 transition-colors hover:bg-violet-50/40 rounded-lg px-2 -mx-2 animate-slide-up-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-100 to-amber-100 grid place-items-center text-sm font-semibold text-violet-700 shrink-0">
                            {(a.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{a.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {a.email ?? 'No email'} · {a.student_count ?? 0} student{a.student_count === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.user_id ? (
                            <Badge variant="default" className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Awaiting signup</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-2">
              <CardHeader>
                <CardTitle className="text-base tracking-tight flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow shadow-amber-500/25">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  Pending invites
                  <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">{pendingInvites.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingInvites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {pendingInvites.map((inv, i) => {
                      const expired = inv.expires_at && new Date(inv.expires_at) < new Date();
                      const daysLeft = inv.expires_at
                        ? differenceInDays(new Date(inv.expires_at), new Date())
                        : null;
                      return (
                        <div
                          key={inv.id}
                          style={{ animationDelay: `${i * 50}ms` }}
                          className="flex items-center justify-between py-3 transition-colors hover:bg-amber-50/40 rounded-lg px-2 -mx-2 animate-slide-up-sm"
                        >
                          <div>
                            <div className="font-medium">{inv.name || inv.email || 'Unnamed invite'}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                              {expired ? (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" /> Expired
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                                  <Clock className="h-3 w-3" /> Pending
                                </Badge>
                              )}
                              <span>
                                Sent {formatDistanceToNowStrict(new Date(inv.created_at))} ago
                                {!expired && daysLeft !== null && ` · expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} className="gap-1.5 rounded-lg press-soft">
                              <Link2 className="h-3.5 w-3.5" /> Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendInvite(inv.id, inv.email, inv.name)}
                              disabled={busyInviteId === inv.id}
                              className="gap-1.5 rounded-lg press-soft"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${busyInviteId === inv.id ? 'animate-spin' : ''}`} /> Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeInvite(inv.id)}
                              disabled={busyInviteId === inv.id}
                              className="gap-1.5 rounded-lg press-soft text-destructive hover:text-destructive hover:bg-rose-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
