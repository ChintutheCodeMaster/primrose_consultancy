import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, Send, MessageSquare, AlertCircle, ArrowLeft, CheckCheck, Check, Plus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNogaIdentity } from '@/lib/nogaIdentity';

type DBConversation = {
  id: string;
  student_id: string;
  advisor_id: string;
  status: 'active' | 'urgent' | 'archived';
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

type DBMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

type AdvisorRow = {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
};

const initials = (name: string | null | undefined) =>
  (name || '?').split(' ').map((s) => s[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFull = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

export default function StudentMessages() {
  const identity = useNogaIdentity();
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, DBMessage[]>>({});
  const [advisors, setAdvisors] = useState<Record<string, AdvisorRow>>({});
  const [selected, setSelected] = useState<DBConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showNewConv, setShowNewConv] = useState(false);
  const [assignedAdvisor, setAssignedAdvisor] = useState<AdvisorRow | null>(null);
  const [firstMessage, setFirstMessage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (identity.loading || !identity.studentId) {
      if (!identity.loading) setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: convData } = await supabase
        .from('conversations' as any)
        .select('*')
        .eq('student_id', identity.studentId)
        .order('updated_at', { ascending: false });
      if (cancelled) return;
      const convs = ((convData as any[]) ?? []) as DBConversation[];
      setConversations(convs);
      if (convs.length > 0) setSelected(convs[0]);

      if (convs.length > 0) {
        const advisorIds = [...new Set(convs.map((c) => c.advisor_id))];
        const { data: advisorRows } = await supabase
          .from('advisors')
          .select('id, name, email, user_id')
          .in('id', advisorIds);
        const advisorMap: Record<string, AdvisorRow> = {};
        ((advisorRows as any[]) ?? []).forEach((a) => { advisorMap[a.id] = a; });
        setAdvisors(advisorMap);

        const { data: msgs } = await supabase
          .from('messages' as any)
          .select('*')
          .in('conversation_id', convs.map((c) => c.id))
          .order('created_at', { ascending: true });
        const grouped: Record<string, DBMessage[]> = {};
        ((msgs as any[]) ?? []).forEach((m: DBMessage) => {
          if (!grouped[m.conversation_id]) grouped[m.conversation_id] = [];
          grouped[m.conversation_id].push(m);
        });
        setMessages(grouped);
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [identity.loading, identity.studentId]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const convIds = conversations.map((c) => c.id);
    const channel = supabase
      .channel(`student-messages-${identity.studentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'noga', table: 'messages' },
        (payload) => {
          const msg = payload.new as DBMessage;
          if (!convIds.includes(msg.conversation_id)) return;
          setMessages((prev) => ({
            ...prev,
            [msg.conversation_id]: [...(prev[msg.conversation_id] || []), msg],
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'noga', table: 'messages' },
        (payload) => {
          const msg = payload.new as DBMessage;
          if (!convIds.includes(msg.conversation_id)) return;
          setMessages((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || []).map((m) =>
              m.id === msg.id ? msg : m
            ),
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversations, identity.studentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected]);

  const selectConversation = async (conv: DBConversation) => {
    setSelected(conv);
    const unread = (messages[conv.id] || []).filter(
      (m) => !m.read && m.sender_id !== identity.authUserId
    );
    if (unread.length === 0) return;
    await supabase
      .from('messages' as any)
      .update({ read: true } as any)
      .in('id', unread.map((m) => m.id));
    setMessages((prev) => ({
      ...prev,
      [conv.id]: (prev[conv.id] || []).map((m) =>
        !m.read && m.sender_id !== identity.authUserId ? { ...m, read: true } : m
      ),
    }));
  };

  const openNewConvDialog = async () => {
    if (!identity.studentId) return;
    const { data: studentRow } = await supabase
      .from('students')
      .select('advisor_id')
      .eq('id', identity.studentId)
      .maybeSingle();
    const advisorId = (studentRow as any)?.advisor_id;
    if (!advisorId) {
      setAssignedAdvisor(null);
      setShowNewConv(true);
      return;
    }
    const { data: advisor } = await supabase
      .from('advisors')
      .select('id, name, email, user_id')
      .eq('id', advisorId)
      .maybeSingle();
    setAssignedAdvisor((advisor as any) ?? null);
    setFirstMessage('');
    setShowNewConv(true);
  };

  const startConversation = async () => {
    if (!assignedAdvisor || !firstMessage.trim() || !identity.studentId || !identity.authUserId) return;
    setCreating(true);
    try {
      const existing = conversations.find(
        (c) => c.student_id === identity.studentId && c.advisor_id === assignedAdvisor.id
      );
      if (existing) {
        const { data: msg } = await supabase
          .from('messages' as any)
          .insert({
            conversation_id: existing.id,
            sender_id: identity.authUserId,
            content: firstMessage.trim(),
          } as any)
          .select()
          .single();
        if (msg) {
          setMessages((prev) => ({
            ...prev,
            [existing.id]: [...(prev[existing.id] || []), msg as any],
          }));
        }
        setSelected(existing);
      } else {
        const { data: conv, error: convError } = await supabase
          .from('conversations' as any)
          .insert({
            student_id: identity.studentId,
            advisor_id: assignedAdvisor.id,
            status: 'active',
          } as any)
          .select()
          .single();
        if (convError) throw convError;
        const conversation = conv as any as DBConversation;
        const { data: msg } = await supabase
          .from('messages' as any)
          .insert({
            conversation_id: conversation.id,
            sender_id: identity.authUserId,
            content: firstMessage.trim(),
          } as any)
          .select()
          .single();
        setAdvisors((prev) => ({ ...prev, [assignedAdvisor.id]: assignedAdvisor }));
        setConversations((prev) => [conversation, ...prev]);
        setMessages((prev) => ({ ...prev, [conversation.id]: msg ? [msg as any] : [] }));
        setSelected(conversation);
      }
      setShowNewConv(false);
      setFirstMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Could not start conversation');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selected || !identity.authUserId) return;
    const content = newMessage.trim();
    setNewMessage('');
    const { error } = await supabase
      .from('messages' as any)
      .insert({
        conversation_id: selected.id,
        sender_id: identity.authUserId,
        content,
      } as any);
    if (error) {
      toast.error('Send failed');
      setNewMessage(content);
    }
  };

  const totalUnread = useMemo(
    () => Object.values(messages).flat().filter((m) => !m.read && m.sender_id !== identity.authUserId).length,
    [messages, identity.authUserId]
  );

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((c) => {
        const advisorName = advisors[c.advisor_id]?.name ?? '';
        const lastMsg = messages[c.id]?.at(-1)?.content ?? '';
        const q = searchTerm.toLowerCase();
        return advisorName.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const aLast = messages[a.id]?.at(-1)?.created_at ?? a.updated_at;
        const bLast = messages[b.id]?.at(-1)?.created_at ?? b.updated_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
  }, [conversations, advisors, messages, searchTerm]);

  if (identity.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!identity.studentId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Your account isn&apos;t linked yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ask your consultant to link your account to your student profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 z-10 bg-background">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm">
              <Link to="/student"><ArrowLeft className="h-4 w-4 mr-1" /> Home</Link>
            </Button>
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1 text-sm">
              <AlertCircle className="h-4 w-4" />
              {totalUnread} unread
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[680px] rounded-xl border overflow-hidden shadow-sm">
          <div className="lg:col-span-1 flex flex-col border-r bg-card">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Conversations
                </h2>
                <Button size="sm" onClick={openNewConvDialog} title="New conversation">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading…</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <Button size="sm" className="mt-3" onClick={openNewConvDialog}>
                    <Plus className="h-4 w-4 mr-1" /> Start one
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const advisor = advisors[conv.advisor_id];
                  const convMessages = messages[conv.id] || [];
                  const lastMsg = convMessages.at(-1);
                  const unreadCount = convMessages.filter(
                    (m) => !m.read && m.sender_id !== identity.authUserId
                  ).length;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 cursor-pointer border-l-4 transition-colors hover:bg-muted/50 ${
                        selected?.id === conv.id
                          ? 'bg-muted border-l-primary'
                          : conv.status === 'urgent'
                          ? 'border-l-destructive'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                            {initials(advisor?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{advisor?.name || 'Your consultant'}</p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {lastMsg ? formatTime(lastMsg.created_at) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {lastMsg?.content || 'No messages yet'}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs shrink-0">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col bg-card">
            {selected ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                      {initials(advisors[selected.advisor_id]?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{advisors[selected.advisor_id]?.name || 'Your consultant'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selected.status === 'urgent' ? '🔴 Urgent' : '● Active'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
                  {(messages[selected.id] || []).map((msg) => {
                    const isMe = msg.sender_id === identity.authUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-card text-foreground rounded-tl-sm border'
                          }`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-muted-foreground">{formatFull(msg.created_at)}</span>
                            {isMe && (msg.read
                              ? <CheckCheck className="h-3 w-3 text-primary" />
                              : <Check className="h-3 w-3 text-muted-foreground" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t p-4">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[52px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to send ·{' '}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Shift+Enter</kbd> for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                  <p className="text-muted-foreground text-sm">Choose one from the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Message your consultant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!assignedAdvisor ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                You don&apos;t have a consultant assigned yet. Contact support to get linked.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(assignedAdvisor.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{assignedAdvisor.name}</p>
                    <p className="text-xs text-muted-foreground">{assignedAdvisor.email}</p>
                  </div>
                </div>
                <Textarea
                  placeholder="Type your message…"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!firstMessage.trim() || creating}
                    onClick={startConversation}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {creating ? 'Sending…' : 'Send message'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewConv(false)}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
