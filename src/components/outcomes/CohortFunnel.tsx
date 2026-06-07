import type { OutcomesCohort } from '@/hooks/useOutcomesData';

function usd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function CohortFunnel({ cohorts }: { cohorts: OutcomesCohort[] }) {
  const display = cohorts.slice(0, 4);

  if (display.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No cohort data yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {display.map((c) => {
        const stages = [
          { label: 'Leads', val: c.leads, tone: 'bg-sky-100 text-sky-900' },
          { label: 'Signed', val: c.signed, tone: 'bg-indigo-100 text-indigo-900' },
          { label: 'Active', val: c.active, tone: 'bg-violet-100 text-violet-900' },
          { label: 'Accepted', val: c.accepted, tone: 'bg-emerald-100 text-emerald-900' },
          { label: 'Enrolled', val: c.enrolled, tone: 'bg-amber-100 text-amber-900' },
        ];
        const max = Math.max(1, ...stages.map((s) => s.val));
        const conv = c.leads > 0 ? Math.round((c.signed / c.leads) * 100) : 0;
        return (
          <div key={c.cohort} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cohort</div>
                <div className="text-2xl font-bold text-foreground">{c.cohort}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Collected</div>
                <div className="text-sm font-semibold text-emerald-700">{usd(c.collectedUSD)}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {stages.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <div className="w-16 text-muted-foreground">{s.label}</div>
                  <div className="flex-1 overflow-hidden rounded-md bg-muted/40">
                    <div
                      className={`${s.tone} h-6 rounded-md px-2 text-left text-xs leading-6 font-semibold transition-all`}
                      style={{ width: `${Math.max(8, (s.val / max) * 100)}%` }}
                    >
                      {s.val}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Lead → Signed conversion: <span className="font-semibold text-foreground">{conv}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
