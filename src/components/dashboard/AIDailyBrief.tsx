import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  stats: Record<string, unknown>;
  className?: string;
}

const CACHE_KEY = 'rose-daily-brief';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AIDailyBrief({ stats, className }: Props) {
  const [brief, setBrief] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    setError(null);
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && cached.date === todayKey() && cached.brief) {
          setBrief(cached.brief);
          return;
        }
      } catch {}
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-brief', { body: { stats } });
      if (error) throw error;
      const b = (data as any)?.brief ?? '';
      setBrief(b);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), brief: b }));
    } catch (e: any) {
      setError(e?.message || 'Rose is resting');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (stats && Object.keys(stats).length > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stats)]);

  const lines = brief
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[•\-\*]\s*/, ''));

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-lg',
        'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white',
        className,
      )}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">Rose · Your AI Strategist</p>
            <h2 className="text-xl font-semibold">Today's Brief</h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => load(true)}
          disabled={loading}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="relative mt-5 space-y-3">
        {loading && lines.length === 0 && (
          <>
            <div className="h-4 w-11/12 animate-pulse rounded bg-white/15" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-white/15" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-white/15" />
          </>
        )}
        {!loading && lines.length === 0 && !error && (
          <p className="text-white/80 text-sm">Rose is preparing your brief…</p>
        )}
        {error && (
          <p className="text-amber-100 text-sm">Rose is resting. Try again shortly.</p>
        )}
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3 animate-fade-in">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <p className="text-[15px] leading-relaxed text-white/95">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
