import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Loader2,
  Wand2,
  Brain,
  Check,
  X,
  Send,
  MessageSquarePlus,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-ai`;

type Suggestion = {
  id: string;
  original: string;
  suggested: string;
  reason: string;
  category?: string;
  start: number;
  end: number;
  state: 'open' | 'accepted' | 'dismissed' | 'sent';
};

type Feedback = {
  thesis_check?: string;
  structure_outline?: string[];
  voice_notes?: string;
  prompt_fit_gaps?: string[];
  socratic_questions?: string[];
} | null;

const stripHtml = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const CATEGORY_STYLE: Record<string, { dot: string; label: string }> = {
  grammar: { dot: 'bg-rose-500', label: 'Grammar' },
  clarity: { dot: 'bg-amber-500', label: 'Clarity' },
  concision: { dot: 'bg-violet-500', label: 'Concision' },
  voice: { dot: 'bg-sky-500', label: 'Voice' },
  style: { dot: 'bg-indigo-500', label: 'Style' },
  other: { dot: 'bg-muted-foreground', label: 'Suggestion' },
};

function classify(reason: string): string {
  const r = (reason || '').toLowerCase();
  if (/(typo|spell|grammar|tense|agreement|punctuation|comma|apostrophe)/.test(r)) return 'grammar';
  if (/(wordy|redundan|concis|repeat|filler)/.test(r)) return 'concision';
  if (/(clarity|unclear|vague|awkward|confus)/.test(r)) return 'clarity';
  if (/(voice|tone|generic|authentic)/.test(r)) return 'voice';
  if (/(style|formal|informal|passive)/.test(r)) return 'style';
  return 'other';
}

async function streamAI({ mode, body, onChunk }: { mode: string; body: any; onChunk: (s: string) => void }) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ mode, ...body }),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited — try again in a moment.');
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

export default function ConsultantEssayReview() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { data: d }] = await Promise.all([
        supabase.from('students').select('id, name, last_name').eq('id', id).maybeSingle(),
        supabase
          .from('student_documents_v2')
          .select('*')
          .eq('student_id', id)
          .order('updated_at', { ascending: false }),
      ]);
      setStudent(s);
      setDocs(d || []);
      if (d && d.length && !selectedDocId) setSelectedDocId(d[0].id);
    })();
  }, [id]);

  if (!id) return null;

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 pb-12 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link to="/students">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Students
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" /> Essay Review
              {student && (
                <span className="ml-2 text-muted-foreground font-normal text-xl">
                  · {student.name} {student.last_name ?? ''}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered line-by-line review. Accept edits, dismiss noise, or send any note straight to the student as
              an inline comment.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Doc list */}
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 px-1">
              Documents ({docs.length})
            </div>
            {docs.length === 0 && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No documents yet. Once the student starts a draft, it'll appear here.
                </CardContent>
              </Card>
            )}
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDocId(d.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedDocId === d.id ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{d.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{d.kind}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>

          {/* Reviewer */}
          {selectedDocId ? (
            <Reviewer key={selectedDocId} documentId={selectedDocId} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Select a document to start reviewing.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function Reviewer({ documentId }: { documentId: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [plain, setPlain] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loadingPolish, setLoadingPolish] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: d } = await supabase
        .from('student_documents_v2')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();
      setDoc(d);
      const { data: vs } = await supabase
        .from('student_document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_no', { ascending: false })
        .limit(1);
      const v = vs?.[0];
      setVersion(v);
      setPlain(stripHtml(v?.body_text || ''));
      setSuggestions([]);
      setFeedback(null);
    })();
  }, [documentId]);

  const runPolish = async () => {
    if (!plain.trim()) {
      toast.error('Draft is empty.');
      return;
    }
    setLoadingPolish(true);
    let acc = '';
    try {
      await streamAI({
        mode: 'polish',
        body: { input: plain },
        onChunk: (s) => {
          acc += s;
        },
      });
      const parsed = JSON.parse(acc);
      const list: Suggestion[] = (parsed.suggestions || [])
        .map((s: any, i: number) => {
          const start = plain.indexOf(s.original);
          return {
            id: `sg-${i}-${Date.now()}`,
            original: s.original,
            suggested: s.suggested,
            reason: s.reason,
            category: classify(s.reason),
            start,
            end: start >= 0 ? start + s.original.length : -1,
            state: 'open' as const,
          };
        })
        .filter((s: Suggestion) => s.start >= 0);
      setSuggestions(list);
      toast.success(`${list.length} suggestions ready.`);
    } catch (e: any) {
      toast.error(e.message || 'Could not generate suggestions.');
    } finally {
      setLoadingPolish(false);
    }
  };

  const runFeedback = async () => {
    if (!plain.trim()) {
      toast.error('Draft is empty.');
      return;
    }
    setLoadingFeedback(true);
    let acc = '';
    try {
      await streamAI({
        mode: 'feedback',
        body: { input: plain, prompt: doc?.prompt_text || '' },
        onChunk: (s) => {
          acc += s;
        },
      });
      setFeedback(JSON.parse(acc));
    } catch (e: any) {
      toast.error(e.message || 'Could not generate feedback.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const acceptSuggestion = async (sg: Suggestion) => {
    if (!version) return;
    const newPlain = plain.slice(0, sg.start) + sg.suggested + plain.slice(sg.end);
    // Replace in HTML too (best-effort)
    const newHtml = (version.body_text || '').includes(sg.original)
      ? (version.body_text || '').replace(sg.original, sg.suggested)
      : `<p>${newPlain.replace(/\n/g, '</p><p>')}</p>`;
    const delta = sg.suggested.length - sg.original.length;
    const updated = suggestions.map((s) => {
      if (s.id === sg.id) return { ...s, state: 'accepted' as const };
      if (s.start > sg.end) return { ...s, start: s.start + delta, end: s.end + delta };
      return s;
    });
    setSuggestions(updated);
    setPlain(newPlain);
    await supabase
      .from('student_document_versions')
      .update({ body_text: newHtml })
      .eq('id', version.id);
    setVersion({ ...version, body_text: newHtml });
    toast.success('Edit applied');
  };

  const dismissSuggestion = (sg: Suggestion) => {
    setSuggestions((list) => list.map((s) => (s.id === sg.id ? { ...s, state: 'dismissed' } : s)));
  };

  const sendAsComment = async (sg: Suggestion) => {
    if (!version) return;
    const body = `Suggestion: "${sg.suggested}"\n\nWhy: ${sg.reason}`;
    const { error } = await supabase.from('student_document_comments').insert({
      version_id: version.id,
      anchor_start: sg.start,
      anchor_end: sg.end,
      author: 'consultant',
      body,
    });
    if (error) {
      toast.error('Could not send comment');
      return;
    }
    setSuggestions((list) => list.map((s) => (s.id === sg.id ? { ...s, state: 'sent' } : s)));
    toast.success('Sent to student');
  };

  const sendFeedbackBlock = async (title: string, body: string) => {
    if (!version) return;
    const { error } = await supabase.from('student_document_comments').insert({
      version_id: version.id,
      author: 'consultant',
      body: `${title}\n\n${body}`,
    });
    if (error) {
      toast.error('Could not send');
      return;
    }
    toast.success('Sent to student');
  };

  const openCount = suggestions.filter((s) => s.state === 'open').length;

  // Render text with highlighted suggestion spans
  const renderedText = useMemo(() => {
    const open = suggestions
      .filter((s) => s.state === 'open' || s.id === hoverId)
      .sort((a, b) => a.start - b.start);
    if (open.length === 0) return <span className="whitespace-pre-wrap">{plain}</span>;
    const parts: any[] = [];
    let cursor = 0;
    open.forEach((s, i) => {
      if (s.start < cursor) return;
      if (s.start > cursor) parts.push(<span key={`t-${i}`}>{plain.slice(cursor, s.start)}</span>);
      const cat = CATEGORY_STYLE[s.category || 'other'];
      const isHover = hoverId === s.id;
      parts.push(
        <mark
          key={s.id}
          onMouseEnter={() => setHoverId(s.id)}
          onMouseLeave={() => setHoverId(null)}
          className={cn(
            'rounded px-0.5 cursor-pointer transition-colors',
            isHover ? 'bg-primary/30' : 'bg-amber-200/50 dark:bg-amber-900/30',
            'border-b-2',
            cat.dot.replace('bg-', 'border-'),
          )}
        >
          {plain.slice(s.start, s.end)}
        </mark>,
      );
      cursor = s.end;
    });
    if (cursor < plain.length) parts.push(<span key="tail">{plain.slice(cursor)}</span>);
    return <span className="whitespace-pre-wrap">{parts}</span>;
  }, [plain, suggestions, hoverId]);

  if (!doc) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      {/* Essay pane */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-semibold truncate">{doc.title}</div>
              {doc.prompt_text && (
                <div className="text-xs text-muted-foreground italic truncate">"{doc.prompt_text}"</div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">V{version?.version_no ?? '—'}</Badge>
              <span>{plain.trim() ? plain.trim().split(/\s+/).length : 0} words</span>
            </div>
          </div>
          <div
            ref={textRef}
            className="p-6 text-[15px] leading-relaxed font-serif min-h-[480px] max-h-[70vh] overflow-y-auto"
          >
            {plain ? renderedText : (
              <p className="text-muted-foreground italic">This draft is empty.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI panel */}
      <Card className="lg:sticky lg:top-4 lg:self-start">
        <CardContent className="p-0">
          <Tabs defaultValue="line">
            <div className="border-b px-3 py-2 flex items-center justify-between">
              <TabsList className="bg-transparent p-0 gap-1">
                <TabsTrigger value="line" className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wand2 className="h-3 w-3" /> Line edits
                  {openCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                      {openCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="strategy" className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Brain className="h-3 w-3" /> Strategy
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="line" className="m-0 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <Button
                onClick={runPolish}
                disabled={loadingPolish || !plain.trim()}
                className="w-full gap-2"
                size="sm"
              >
                {loadingPolish ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {suggestions.length ? 'Re-scan draft' : 'Scan for line edits'}
              </Button>

              {!loadingPolish && suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-4">
                  Run a scan to surface grammar, clarity, concision, voice, and style suggestions.
                </p>
              )}

              {suggestions.map((sg) => {
                const cat = CATEGORY_STYLE[sg.category || 'other'];
                return (
                  <div
                    key={sg.id}
                    onMouseEnter={() => setHoverId(sg.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={cn(
                      'rounded-lg border p-3 space-y-2 transition-colors',
                      sg.state === 'open' ? 'bg-card' : 'opacity-60 bg-muted/40',
                      hoverId === sg.id && 'ring-2 ring-primary/40',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', cat.dot)} />
                      <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                        {cat.label}
                      </span>
                      {sg.state !== 'open' && (
                        <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                          {sg.state}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="line-through text-rose-600 dark:text-rose-400">{sg.original}</div>
                      <div className="text-emerald-700 dark:text-emerald-400">{sg.suggested}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">{sg.reason}</p>
                    {sg.state === 'open' && (
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="default" className="h-7 gap-1" onClick={() => acceptSuggestion(sg)}>
                          <Check className="h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => sendAsComment(sg)}>
                          <Send className="h-3 w-3" /> Send to student
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => dismissSuggestion(sg)}>
                          <X className="h-3 w-3" /> Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="strategy" className="m-0 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <Button
                onClick={runFeedback}
                disabled={loadingFeedback || !plain.trim()}
                className="w-full gap-2"
                size="sm"
              >
                {loadingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {feedback ? 'Re-analyze' : 'Analyze structure & voice'}
              </Button>

              {!feedback && !loadingFeedback && (
                <p className="text-xs text-muted-foreground text-center pt-4">
                  Get thesis check, structural outline, voice notes, and prompt-fit gaps.
                </p>
              )}

              {feedback && (
                <div className="space-y-4">
                  <FeedbackBlock
                    title="Thesis check"
                    onSend={() => sendFeedbackBlock('Thesis check', feedback.thesis_check || '')}
                  >
                    <p>{feedback.thesis_check}</p>
                  </FeedbackBlock>
                  <FeedbackBlock
                    title="Structure"
                    onSend={() =>
                      sendFeedbackBlock('Structure', (feedback.structure_outline || []).map((s) => `• ${s}`).join('\n'))
                    }
                  >
                    <ul className="list-disc pl-5 space-y-0.5">
                      {(feedback.structure_outline || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </FeedbackBlock>
                  <FeedbackBlock
                    title="Voice"
                    onSend={() => sendFeedbackBlock('Voice', feedback.voice_notes || '')}
                  >
                    <p>{feedback.voice_notes}</p>
                  </FeedbackBlock>
                  <FeedbackBlock
                    title="Prompt-fit gaps"
                    onSend={() =>
                      sendFeedbackBlock(
                        'Prompt-fit gaps',
                        (feedback.prompt_fit_gaps || []).map((s) => `• ${s}`).join('\n'),
                      )
                    }
                  >
                    <ul className="list-disc pl-5 space-y-0.5">
                      {(feedback.prompt_fit_gaps || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </FeedbackBlock>
                  <FeedbackBlock
                    title="Questions to push thinking"
                    onSend={() =>
                      sendFeedbackBlock(
                        'Questions to push thinking',
                        (feedback.socratic_questions || []).map((s, i) => `${i + 1}. ${s}`).join('\n'),
                      )
                    }
                  >
                    <ol className="list-decimal pl-5 space-y-0.5">
                      {(feedback.socratic_questions || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </FeedbackBlock>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackBlock({
  title,
  children,
  onSend,
}: {
  title: string;
  children: any;
  onSend: () => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground">{title}</div>
        <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={onSend}>
          <MessageSquarePlus className="h-3 w-3" /> Send
        </Button>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
