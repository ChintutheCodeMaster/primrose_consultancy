import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Signal = { label: string; weight: 'low' | 'medium' | 'high'; evidence?: string };
type Result = {
  ai_likelihood?: number;
  verdict?: string;
  signals?: Signal[];
  human_voice_strengths?: string[];
  ai_tells?: string[];
  recommendation?: string;
  error?: string;
};

export function AiDetector() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async () => {
    if (text.trim().length < 80) {
      toast({ title: 'Paste more text', description: 'Need at least 80 characters.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-detector', { body: { text } });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'AI error', description: data.error, variant: 'destructive' });
        return;
      }
      setResult(data);
    } catch (e: any) {
      toast({ title: 'Could not analyze', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const score = result?.ai_likelihood ?? 0;
  const scoreColor =
    score >= 70 ? 'from-rose-500 to-orange-500'
    : score >= 40 ? 'from-amber-400 to-yellow-500'
    : 'from-emerald-500 to-teal-500';

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">AI writing detector</h3>
          <p className="text-xs text-muted-foreground">Paste an essay draft to estimate AI authorship likelihood.</p>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the essay text here…"
        className="min-h-[180px] font-serif text-sm leading-relaxed"
      />
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{text.length.toLocaleString()} characters</span>
        <span>Detection is heuristic — never the only signal.</span>
      </div>

      <Button onClick={submit} disabled={loading} className="mt-3 w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Analyzing…' : 'Run detector'}
      </Button>

      {result && !result.error && (
        <div className="mt-5 space-y-4 animate-fade-in">
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">AI likelihood</p>
              <p className="text-sm font-semibold">{result.verdict}</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-4xl font-bold tracking-tight tabular-nums">{score}<span className="text-xl text-muted-foreground">%</span></p>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div className={`h-2 rounded-full bg-gradient-to-r ${scoreColor} transition-all`} style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>

          {result.signals && result.signals.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signals</p>
              <div className="space-y-1.5">
                {result.signals.map((s, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.label}</span>
                      <span className={
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ' +
                        (s.weight === 'high' ? 'bg-rose-100 text-rose-700'
                          : s.weight === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700')
                      }>{s.weight}</span>
                    </div>
                    {s.evidence && <p className="mt-1 text-xs text-muted-foreground italic">"{s.evidence}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <ListBox title="Human voice" items={result.human_voice_strengths} tone="emerald" />
            <ListBox title="AI tells" items={result.ai_tells} tone="rose" />
          </div>

          {result.recommendation && (
            <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
              <strong>Recommendation:</strong> {result.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ListBox({ title, items, tone }: { title: string; items?: string[]; tone: 'emerald' | 'rose' }) {
  if (!items || items.length === 0) return null;
  const cls = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50';
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <ul className="space-y-1 text-xs">
        {items.map((it, i) => <li key={i}>• {it}</li>)}
      </ul>
    </div>
  );
}
