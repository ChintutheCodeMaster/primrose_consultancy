import { cn } from '@/lib/utils';

interface Props {
  universities: string[];
  cohorts: string[];
  cells: Record<string, Record<string, number>>;
}

export function OutcomesHeatmap({ universities, cohorts, cells }: Props) {
  const max = Math.max(
    1,
    ...universities.flatMap((u) => cohorts.map((c) => cells[u]?.[c] ?? 0))
  );

  if (universities.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No acceptances recorded yet. Once students start getting in, this heatmap will populate automatically.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-4">
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
