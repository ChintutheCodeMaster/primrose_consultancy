import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { OutcomesData } from '@/hooks/useOutcomesData';

const SUGGESTIONS = [
  'Which schools punched above their weight last year?',
  'What was our strongest cohort and why?',
  'How does our acceptance volume compare to peers?',
  'What should I highlight to prospective families?',
];

export function AskRosePanel({ outcomes }: { outcomes: OutcomesData | undefined }) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || !outcomes) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke('ask-rose-outcomes', {
        body: {
          question,
          stats: {
            totals: outcomes.totals,
            cohorts: outcomes.cohorts,
            top_universities: outcomes.topUniversities.slice(0, 10),
          },
        },
      });
      if (error) throw error;
      setAnswer((data as { answer: string }).answer);
    } catch (e) {
      setAnswer('Sorry — Rose is unavailable right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-emerald-50/60 via-card to-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Ask Rose about your outcomes</div>
          <div className="text-xs text-muted-foreground">AI strategist trained on your practice data</div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-2"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. What's our strongest cohort?"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !q.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {!answer && !loading && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQ(s);
                ask(s);
              }}
              className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-900"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rose is thinking…
        </div>
      )}

      {answer && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border bg-background/70 p-4 text-sm leading-relaxed text-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}
