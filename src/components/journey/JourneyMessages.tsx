import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';

type ConversationRow = {
  id: string;
  advisor_id: string;
  status: string;
  updated_at: string;
};

type AdvisorRow = { id: string; name: string };

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export function JourneyMessages({ studentId }: { studentId: string }) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [advisors, setAdvisors] = useState<Record<string, AdvisorRow>>({});
  const [latestByConv, setLatestByConv] = useState<Record<string, MessageRow>>({});
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (!cancelled) setAuthUserId(user.id);

      const { data: convData } = await supabase
        .from('conversations' as any)
        .select('id, advisor_id, status, updated_at')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false });
      if (cancelled) return;
      const convs = ((convData as any[]) ?? []) as ConversationRow[];
      setConversations(convs);

      if (convs.length === 0) return;

      const advisorIds = [...new Set(convs.map((c) => c.advisor_id))];
      const { data: advRows } = await supabase
        .from('advisors')
        .select('id, name')
        .in('id', advisorIds);
      const advMap: Record<string, AdvisorRow> = {};
      ((advRows as any[]) ?? []).forEach((a) => { advMap[a.id] = a; });
      setAdvisors(advMap);

      const { data: msgs } = await supabase
        .from('messages' as any)
        .select('*')
        .in('conversation_id', convs.map((c) => c.id))
        .order('created_at', { ascending: false });
      const latest: Record<string, MessageRow> = {};
      const unread: Record<string, number> = {};
      ((msgs as any[]) ?? []).forEach((m: MessageRow) => {
        if (!latest[m.conversation_id]) latest[m.conversation_id] = m;
        if (!m.read && m.sender_id !== user.id) {
          unread[m.conversation_id] = (unread[m.conversation_id] ?? 0) + 1;
        }
      });
      setLatestByConv(latest);
      setUnreadByConv(unread);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const totalUnread = Object.values(unreadByConv).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A direct line to your consultant.
          </p>
        </div>
        <Button asChild>
          <Link to="/student/messages">
            Open Messages <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {totalUnread > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          You have {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/student/messages">Start one</Link>
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const advisor = advisors[conv.advisor_id];
              const latest = latestByConv[conv.id];
              const unread = unreadByConv[conv.id] ?? 0;
              return (
                <Link
                  to="/student/messages"
                  key={conv.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {advisor?.name || 'Your consultant'}
                      </p>
                      {unread > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                          {unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {latest?.content || 'No messages yet'}
                    </p>
                    {latest && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(latest.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
