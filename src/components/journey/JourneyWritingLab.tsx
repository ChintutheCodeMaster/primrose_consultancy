import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, BookOpen, MessageCircle, PenLine, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'feedback' | 'brainstorm' | 'polish';

const MODES: { id: Mode; label: string; icon: any; desc: string }[] = [
  { id: 'feedback', label: 'Essay feedback', icon: BookOpen, desc: 'Structural critique. Never rewrites your prose.' },
  { id: 'brainstorm', label: 'Brainstorm coach', icon: MessageCircle, desc: 'Ideas → outline. Stops short of drafting.' },
  { id: 'polish', label: 'Grammar polish', icon: PenLine, desc: 'Surface fixes only. Your ideas stay yours.' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-ai`;

export function JourneyWritingLab({ studentId }: { studentId: string }) {
  const [mode, setMode] = useState<Mode>('feedback');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Writing Lab
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI tools designed to help you think, not write for you. Every session is shared transparently with your consultant.
        </p>
      </div>

      {/* Ethics banner */}
      <div className="flex gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-900 dark:text-amber-200">
          <strong>The words must be yours.</strong> Colleges expect your authentic voice. These tools refuse to draft prose
          for you — they help you reflect, structure, and refine what you've already written.
        </div>
      </div>

      {/* Mode picker */}
      <div className="grid sm:grid-cols-3 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'text-left p-3 rounded-xl border transition-colors',
                active ? 'border-primary bg-primary/5' : 'hover:bg-muted',
              )}
            >
              <Icon className={cn('h-4 w-4 mb-1', active ? 'text-primary' : 'text-muted-foreground')} />
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
            </button>
          );
        })}
      </div>

      {mode === 'feedback' && <FeedbackMode studentId={studentId} />}
      {mode === 'brainstorm' && <BrainstormMode studentId={studentId} />}
      {mode === 'polish' && <PolishMode studentId={studentId} />}
    </div>
  );
}

async function streamAI({
  mode,
  body,
  onChunk,
}: {
  mode: string;
  body: any;
  onChunk: (s: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ mode, ...body }),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited, please try again shortly.');
    if (resp.status === 402) throw new Error('AI credits exhausted.');
    throw new Error('AI request failed');
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
}

function FeedbackMode({ studentId }: { studentId: string }) {
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [raw, setRaw] = useState('');

  const run = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    setResult(null);
    setRaw('');
    let acc = '';
    try {
      await streamAI({
        mode: 'feedback',
        body: { prompt, input: draft },
        onChunk: (s) => {
          acc += s;
          setRaw(acc);
        },
      });
      try {
        const parsed = JSON.parse(acc);
        setResult(parsed);
        await supabase.from('student_ai_sessions').insert({
          student_id: studentId,
          mode: 'feedback',
          input_text: `Prompt:\n${prompt}\n\nDraft:\n${draft}`,
          output_json: parsed,
        });
      } catch {
        toast.error('Could not parse AI response — try again.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="space-y-1">
          <Label>Essay prompt</Label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <Label>Your draft</Label>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} />
        </div>
        <Button onClick={run} disabled={loading || !draft.trim()} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get feedback
        </Button>

        {loading && !result && <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{raw}</pre>}

        {result && (
          <div className="space-y-4 pt-2 border-t">
            <Block title="Thesis check">{result.thesis_check}</Block>
            <Block title="Structure (what's actually there)">
              <ul className="list-disc pl-5 space-y-1">
                {(result.structure_outline || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Block>
            <Block title="Voice">{result.voice_notes}</Block>
            <Block title="Prompt-fit gaps">
              <ul className="list-disc pl-5 space-y-1">
                {(result.prompt_fit_gaps || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Block>
            <Block title="Questions to push your thinking">
              <ul className="list-decimal pl-5 space-y-1">
                {(result.socratic_questions || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Block>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Block({ title, children }: { title: string; children: any }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function BrainstormMode({ studentId }: { studentId: string }) {
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    const next = [...history, userMsg];
    setHistory([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    let acc = '';
    try {
      await streamAI({
        mode: 'brainstorm',
        body: { history: next },
        onChunk: (s) => {
          acc += s;
          setHistory((h) => {
            const copy = [...h];
            copy[copy.length - 1] = { role: 'assistant', content: acc };
            return copy;
          });
        },
      });
      await supabase.from('student_ai_sessions').insert({
        student_id: studentId,
        mode: 'brainstorm',
        input_text: userMsg.content,
        output_json: { reply: acc },
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Start by telling me what you're trying to write about, or share an experience you've been thinking on.
            </p>
          )}
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {m.content || (loading ? '...' : '')}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PolishMode({ studentId }: { studentId: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSuggestions([]);
    setAccepted(new Set());
    let acc = '';
    try {
      await streamAI({
        mode: 'polish',
        body: { input: text },
        onChunk: (s) => {
          acc += s;
        },
      });
      try {
        const parsed = JSON.parse(acc);
        setSuggestions(parsed.suggestions || []);
        await supabase.from('student_ai_sessions').insert({
          student_id: studentId,
          mode: 'polish',
          input_text: text,
          output_json: parsed,
        });
      } catch {
        toast.error('Could not parse AI response.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const accept = (i: number) => {
    const s = suggestions[i];
    setText((t) => t.replace(s.original, s.suggested));
    setAccepted((a) => new Set(a).add(i));
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Label>Your text</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
        <Button onClick={run} disabled={loading || !text.trim()} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
          Find surface fixes
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {suggestions.length} suggestions — accept the ones that feel right.
            </div>
            {suggestions.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border space-y-1 text-sm">
                <div className="line-through text-rose-600">{s.original}</div>
                <div className="text-emerald-700">{s.suggested}</div>
                <div className="text-xs text-muted-foreground">{s.reason}</div>
                <div>
                  <Button
                    size="sm"
                    variant={accepted.has(i) ? 'secondary' : 'outline'}
                    disabled={accepted.has(i)}
                    onClick={() => accept(i)}
                  >
                    {accepted.has(i) ? 'Applied' : 'Accept'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
