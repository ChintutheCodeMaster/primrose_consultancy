import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export function JourneyMessages({ studentId }: { studentId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from('student_messages')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await supabase.from('student_messages').insert({
      student_id: studentId,
      author: 'student',
      body: text.trim(),
    });
    setSending(false);
    if (error) {
      toast.error('Failed to send');
      return;
    }
    setText('');
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A direct line to your consultant. Replies usually within one business day.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet — say hi!</p>
          )}
          {messages.map((m) => {
            const mine = m.author === 'student';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {m.body}
                  <div className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </CardContent>
      </Card>

      <div className="flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
          }}
        />
        <Button onClick={send} disabled={sending || !text.trim()} className="gap-2">
          <Send className="h-4 w-4" /> Send
        </Button>
      </div>
    </div>
  );
}
