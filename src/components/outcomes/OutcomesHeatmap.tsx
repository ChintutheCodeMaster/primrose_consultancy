import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Props {
  universities: string[];
  cohorts: string[];
  cells: Record<string, Record<string, number>>;
}

const DEMO_UNIS = [
  'Harvard University', 'Stanford University', 'MIT', 'Yale University',
  'Princeton University', 'Columbia University', 'University of Pennsylvania',
  'Brown University', 'Cornell University', 'Dartmouth College',
  'UC Berkeley', 'UCLA', 'University of Chicago', 'Duke University',
  'Northwestern University',
];
const DEMO_COHORTS = ['2022', '2023', '2024', '2025', '2026'];
// Deterministic pseudo-random pattern so it looks real & varied
const DEMO_CELLS: Record<string, Record<string, number>> = (() => {
  const out: Record<string, Record<string, number>> = {};
  DEMO_UNIS.forEach((u, i) => {
    out[u] = {};
    DEMO_COHORTS.forEach((c, j) => {
      const seed = (i * 7 + j * 13 + (i % 3) * 5) % 11;
      const base = i < 5 ? 2 : i < 10 ? 1 : 0;
      const v = Math.max(0, base + (seed % 4) - (j === 0 ? 1 : 0));
      out[u][c] = v;
    });
  });
  return out;
})();

export function OutcomesHeatmap({ universities, cohorts, cells }: Props) {
  const isDemo = universities.length === 0;
  if (isDemo) {
    universities = DEMO_UNIS;
    cohorts = DEMO_COHORTS;
    cells = DEMO_CELLS;
  }

  const max = Math.max(
    1,
    ...universities.flatMap((u) => cohorts.map((c) => cells[u]?.[c] ?? 0))
  );

  return (
    <div className="relative overflow-x-auto rounded-2xl border bg-card p-4">
      {isDemo && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
            <Sparkles className="h-3.5 w-3.5" />
            Sample preview — your real acceptances will replace this as students get in.
          </div>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Demo</span>
        </div>
      )}
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card text-left text-xs font-medium text-muted-foreground" />
            {cohorts.map((c) => (
              <th key={c} className="px-2 py-1 text-center text-xs font-semibold text-muted-foreground">
                {c}
              </th>
            ))}
            <th className="px-2 py-1 text-center text-xs font-semibold text-muted-foreground">All</th>
          </tr>
        </thead>
        <tbody>
          {universities.map((u) => {
            const total = cohorts.reduce((s, c) => s + (cells[u]?.[c] ?? 0), 0);
            return (
              <tr key={u}>
                <td className="sticky left-0 bg-card pr-3 py-1 text-xs font-medium text-foreground/90 max-w-[200px] truncate">
                  {u}
                </td>
                {cohorts.map((c) => {
                  const v = cells[u]?.[c] ?? 0;
                  const intensity = v === 0 ? 0 : 0.15 + (v / max) * 0.75;
                  return (
                    <td key={c} className="p-0">
                      <div
                        className={cn(
                          'flex h-9 w-full min-w-[44px] items-center justify-center rounded-md text-xs font-semibold transition-all',
                          v === 0 ? 'bg-muted/40 text-muted-foreground/40' : 'text-emerald-950'
                        )}
                        style={v > 0 ? { backgroundColor: `hsl(160 70% ${85 - intensity * 35}%)` } : undefined}
                      >
                        {v > 0 ? v : '·'}
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 text-center text-xs font-bold text-foreground">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
