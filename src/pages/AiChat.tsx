import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, User, Sparkles, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

type Message = { role: 'user' | 'assistant'; content: string };

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (resp.status === 429) {
    toast.error('Too many requests, please try again in a moment.');
    onDone();
    return;
  }
  if (resp.status === 402) {
    toast.error('Credits exhausted.');
    onDone();
    return;
  }
  if (!resp.ok || !resp.body) {
    toast.error('Error connecting to AI.');
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const SUGGESTION_PROMPTS = [
  'How many active Students do we have?',
  'Which Students are studying in England?',
  'How many Inquiries have not paid yet?',
  'Which Consultants are the busiest?',
];

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch conversation list
  const { data: conversations = [] } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    })();
  }, [activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    await supabase.from('ai_messages').insert({ conversation_id: conversationId, role, content });
    // Touch updated_at
    await supabase.from('ai_conversations').update({ title: role === 'user' && content.length < 60 ? content : undefined as any }).eq('id', conversationId);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const trimmed = text.trim();
    const userMsg: Message = { role: 'user', content: trimmed };
    const prevMessages = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let convId = activeConversationId;

    // Create new conversation if needed
    if (!convId) {
      const title = trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed;
      const { data } = await supabase.from('ai_conversations').insert({ title }).select('id').single();
      if (data) {
        convId = data.id;
        setActiveConversationId(convId);
        queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      }
    }

    // Save user message
    if (convId) await saveMessage(convId, 'user', trimmed);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...prevMessages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: async () => {
          setIsLoading(false);
          // Save assistant message
          if (convId && assistantSoFar) {
            await saveMessage(convId, 'assistant', assistantSoFar);
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
          }
        },
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      toast.error('Error sending message');
    }
  }, [isLoading, messages, activeConversationId, saveMessage, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('ai_conversations').delete().eq('id', id);
    if (activeConversationId === id) startNewChat();
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
  };

  return (
    <MainLayout>
      <div className="animate-fade-in flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]" dir="ltr">
        {/* Hero header — Rose branding */}
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 mb-4 shadow-lg bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 text-white">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-200/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">Your AI Strategist</p>
              <h1 className="text-2xl sm:text-3xl font-bold">Rose</h1>
              <p className="text-white/85 text-sm mt-0.5">Ask anything about your practice — Students, Leads, statistics, and more.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Conversation sidebar */}
          <div className="w-56 flex-shrink-0 flex flex-col bg-card rounded-xl border border-rose-100 overflow-hidden">
            <div className="p-3 border-b border-rose-100">
              <Button
                onClick={startNewChat}
                size="sm"
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-rose-50/60 transition-colors border-b border-rose-50',
                    activeConversationId === conv.id && 'bg-rose-50'
                  )}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conv.updated_at), 'd MMM', { locale: enUS })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations saved</p>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-card rounded-xl border border-rose-100 overflow-hidden min-h-0">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-rose-50/40 to-transparent">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
                  <div className="rounded-full p-4 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-200">
                    <Sparkles className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">Hi, I'm Rose — how can I help?</h3>
                    <p className="text-muted-foreground text-sm">I can search Students, Leads, statistics, and more across your practice.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {SUGGESTION_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="text-sm px-3 py-2 rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white'
                      : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-rose-100 text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2" dir="ltr">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) => {
                              if (href && href.startsWith('/')) {
                                return (
                                  <button
                                    type="button"
                                    className="text-rose-600 underline hover:text-rose-700 font-medium cursor-pointer bg-transparent border-none p-0 inline"
                                    onClick={() => navigate(href)}
                                    {...(props as any)}
                                  >
                                    {children}
                                  </button>
                                );
                              }
                              return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                            }
                          }}
                        >{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-rose-100 rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-rose-100 p-4 bg-white">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Rose anything about your practice..."
                  className="resize-none min-h-[44px] max-h-[120px] focus-visible:ring-rose-400"
                  rows={1}
                  dir="ltr"
                />
                <Button
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="flex-shrink-0 h-[44px] w-[44px] bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}