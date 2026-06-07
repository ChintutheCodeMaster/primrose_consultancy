import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  yourAcceptances: number;
  yourAvgPackage: number;
  yourStudents: number;
}

interface Benchmark {
  metric: string;
  p25: number;
  p50: number;
  p75: number;
}

export function BenchmarkCards({ yourAcceptances, yourAvgPackage, yourStudents }: Props) {
  const { data: benchmarks = [] } = useQuery<Benchmark[]>({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const { data } = await supabase.from('benchmark_percentiles').select('metric, p25, p50, p75');
      return (data ?? []) as Benchmark[];
    },
  });

  const byMetric = Object.fromEntries(benchmarks.map((b) => [b.metric, b]));

  const cards = [
    {
      label: 'Acceptances per practice',
      yours: yourAcceptances,
      bench: byMetric.acceptances_per_practice ?? { p25: 8, p50: 18, p75: 35 },
      format: (n: number) => n.toString(),
    },
    {
      label: 'Avg engagement value',
      yours: Math.round(yourAvgPackage),
      bench: byMetric.avg_package_value ?? { p25: 4500, p50: 9000, p75: 18000 },
      format: (n: number) => `$${n.toLocaleString()}`,
    },
    {
      label: 'Active roster',
      yours: yourStudents,
      bench: byMetric.active_students ?? { p25: 10, p50: 25, p75: 60 },
      format: (n: number) => n.toString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        let percentile = 'p25';
        let Icon = Minus;
        let tone = 'text-amber-700 bg-amber-50';
        if (c.yours >= c.bench.p75) {
          percentile = 'Top 25%';
          Icon = TrendingUp;
          tone = 'text-emerald-700 bg-emerald-50';
        } else if (c.yours >= c.bench.p50) {
          percentile = 'Above median';
          Icon = TrendingUp;
          tone = 'text-emerald-700 bg-emerald-50';
        } else if (c.yours >= c.bench.p25) {
          percentile = 'Near median';
          Icon = Minus;
          tone = 'text-sky-700 bg-sky-50';
        } else {
          percentile = 'Below p25';
          Icon = TrendingDown;
          tone = 'text-rose-700 bg-rose-50';
        }

        return (
          <div key={c.label} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
                <Icon className="h-3 w-3" />
                {percentile}
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums text-foreground">{c.format(c.yours)}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-muted-foreground">p25</div>
                <div className="font-semibold">{c.format(c.bench.p25)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">p50</div>
                <div className="font-semibold">{c.format(c.bench.p50)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">p75</div>
                <div className="font-semibold">{c.format(c.bench.p75)}</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Benchmarks based on Primrose practice network.
            </p>
          </div>
        );
      })}
    </div>
  );
}
