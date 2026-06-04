import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-ai`;

export function JourneyDetector({ studentId }: { studentId: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    let acc = '';
    try {
      const resp = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: 'detector', input: text }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error('Rate limited.');
        if (resp.status === 402) throw new Error('AI credits exhausted.');
        throw new Error('Request failed');
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
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) acc += content;
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
      try {
        const parsed = JSON.parse(acc);
        setResult(parsed);
        await supabase.from('student_ai_sessions').insert({
          student_id: studentId,
          mode: 'detector',
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> AI Detector
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Paste any text to estimate how likely it reads as AI-generated.
        </p>
      </div>

      <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground items-start">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          This is a heuristic indicator, not proof. Use it to gut-check your own drafts before submitting.
        </span>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste a paragraph or full essay..."
          />
          <Button onClick={run} disabled={loading || !text.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-20 w-20 rounded-full grid place-items-center text-2xl font-bold',
                  result.score >= 70
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                    : result.score >= 40
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                )}
              >
                {result.score}
              </div>
              <div>
                <div className="font-semibold">
                  {result.score >= 70 ? 'Likely AI' : result.score >= 40 ? 'Mixed signals' : 'Likely human'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence: <span className="capitalize">{result.confidence}</span>
                </div>
              </div>
            </div>

            {result.summary && <p className="text-sm">{result.summary}</p>}

            {result.signals?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Signals</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {result.signals.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.paragraph_scores?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Paragraph scores</div>
                <div className="space-y-2">
                  {result.paragraph_scores.map((p: any, i: number) => (
                    <div key={i} className="p-2 rounded border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Paragraph {i + 1}</span>
                        <span className="font-mono">{p.score}</span>
                      </div>
                      <div className="text-muted-foreground italic">"{p.snippet}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
