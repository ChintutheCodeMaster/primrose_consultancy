import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Send, MessageSquare, AlertCircle, AlertTriangle, Plus,
  CheckCheck, Check, Loader2,
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

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
};

const initials = (name: string | null | undefined) =>
  (name || '?').split(' ').map((s) => s[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

export default function ConsultantMessages() {
  const identity = useNogaIdentity();
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, DBMessage[]>>({});
  const [students, setStudents] = useState<Record<string, StudentRow>>({});
  const [selected, setSelected] = useState<DBConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showNewConv, setShowNewConv] = useState(false);
  const [myStudents, setMyStudents] = useState<StudentRow[]>([]);
  const [chosenStudentId, setChosenStudentId] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (identity.loading || !identity.advisorId) return;
    let cancelled = false;
    (async () => {
      const { data: convData } = await supabase
        .from('conversations' as any)
        .select('*')
        .eq('advisor_id', identity.advisorId)
        .order('updated_at', { ascending: false });
      if (cancelled) return;
      const convs = ((convData as any[]) ?? []) as DBConversation[];
      setConversations(convs);

      if (convs.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(convs.map((c) => c.student_id))];
      const { data: studentRows } = await supabase
        .from('students')
        .select('id, name, email, user_id')
        .in('id', studentIds);
      const studentMap: Record<string, StudentRow> = {};
      ((studentRows as any[]) ?? []).forEach((s) => { studentMap[s.id] = s; });
      setStudents(studentMap);

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

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [identity.loading, identity.advisorId]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const convIds = conversations.map((c) => c.id);
    const channel = supabase
      .channel(`consultant-messages-${identity.advisorId}`)
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
  }, [conversations, identity.advisorId]);

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
    if (!identity.advisorId) return;
    const { data } = await supabase
      .from('students')
      .select('id, name, email, user_id')
      .eq('advisor_id', identity.advisorId)
      .order('name');
    const rows = ((data as any[]) ?? []) as StudentRow[];
    setMyStudents(rows);
    setChosenStudentId(rows[0]?.id ?? '');
    setFirstMessage('');
    setShowNewConv(true);
  };

  const startConversation = async () => {
    if (!chosenStudentId || !firstMessage.trim() || !identity.advisorId || !identity.authUserId) return;
    setCreating(true);
    try {
      const existing = conversations.find(
        (c) => c.student_id === chosenStudentId && c.advisor_id === identity.advisorId
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
            student_id: chosenStudentId,
            advisor_id: identity.advisorId,
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
        if (!students[chosenStudentId]) {
          const found = myStudents.find((s) => s.id === chosenStudentId);
          if (found) setStudents((prev) => ({ ...prev, [chosenStudentId]: found }));
        }
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
  const urgentCount = conversations.filter((c) => c.status === 'urgent').length;

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conv) => {
        const name = students[conv.student_id]?.name || '';
        if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        const convMessages = messages[conv.id] || [];
        const hasUnread = convMessages.some((m) => !m.read && m.sender_id !== identity.authUserId);
        if (filter === 'urgent') return conv.status === 'urgent';
        if (filter === 'unread') return hasUnread;
        return true;
      })
      .sort((a, b) => {
        const aLast = messages[a.id]?.at(-1)?.created_at ?? a.updated_at;
        const bLast = messages[b.id]?.at(-1)?.created_at ?? b.updated_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
  }, [conversations, students, messages, filter, searchTerm, identity.authUserId]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground">Communicate with your students</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><MessageSquare className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg"><AlertCircle className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{totalUnread}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" /> Conversations
                </CardTitle>
                <Button size="sm" onClick={openNewConvDialog} title="New conversation">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const student = students[conv.student_id];
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
                          <AvatarFallback>{initials(student?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {student?.name || 'Student'}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                              {conv.status === 'urgent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </div>
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{lastMsg.content}</p>
                          )}
                          {lastMsg && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(lastMsg.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col">
            {selected ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials(students[selected.student_id]?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{students[selected.student_id]?.name || 'Student'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selected.status === 'urgent' ? '🔴 Urgent' : '● Active'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-muted/10">
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
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
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
                  <div className="border-t p-4 flex gap-2 items-end">
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
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
                  <p className="text-muted-foreground text-sm">Choose one from the left to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> New conversation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {myStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You don't have any students assigned to you yet.
                </p>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Student</label>
                    <Select value={chosenStudentId} onValueChange={setChosenStudentId}>
                      <SelectTrigger><SelectValue placeholder="Choose a student…" /></SelectTrigger>
                      <SelectContent>
                        {myStudents.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name || s.email || 'Student'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="First message…"
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={!chosenStudentId || !firstMessage.trim() || creating}
                      onClick={startConversation}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {creating ? 'Starting…' : 'Start conversation'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewConv(false)}>Cancel</Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
