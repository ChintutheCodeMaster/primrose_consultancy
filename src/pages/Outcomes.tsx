import { MainLayout } from '@/components/layout/MainLayout';
import { useOutcomesData } from '@/hooks/useOutcomesData';
import { AcceptanceMap } from '@/components/outcomes/AcceptanceMap';
import { CohortFunnel } from '@/components/outcomes/CohortFunnel';
import { AskRosePanel } from '@/components/outcomes/AskRosePanel';
import { Button } from '@/components/ui/button';
import { Download, Trophy, GraduationCap, Award, DollarSign, Loader2 } from 'lucide-react';

function usd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

const Outcomes = () => {
  const { data, isLoading } = useOutcomesData();

  const headlineStats = data && [
    { label: 'Students served', value: data.totals.students.toString(), icon: GraduationCap, tone: 'text-indigo-700 bg-indigo-50' },
    { label: 'Acceptances (all-time)', value: data.totals.accepted.toString(), icon: Trophy, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Scholarships won', value: data.totals.scholarships.toString(), icon: Award, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Total collected', value: usd(data.totals.collectedUSD), icon: DollarSign, tone: 'text-violet-700 bg-violet-50' },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 pb-12 animate-fade-in print:max-w-none print:p-0">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice Outcomes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your results — visualized, benchmarked, and ready to share with prospective families.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Download report
            </Button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crunching outcomes…
          </div>
        ) : (
          <>
            {/* Headline stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {headlineStats!.map((s) => (
                <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-3xl font-bold tabular-nums text-foreground">{s.value}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Ask Rose */}
            <div className="print:hidden">
              <AskRosePanel outcomes={data} />
            </div>

            {/* Cohort Funnel */}
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Cohort funnel</h2>
                <p className="text-sm text-muted-foreground">
                  Lead → Signed → Active → Accepted → Enrolled, with revenue collected per cohort.
                </p>
              </div>
              <CohortFunnel cohorts={data.cohorts} />
            </section>

            {/* Heatmap */}
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Acceptance map</h2>
                <p className="text-sm text-muted-foreground">
                  Where your students get in — across the US, by state and university.
                </p>
              </div>
              <AcceptanceMap
                acceptances={data.acceptanceList}
                cohorts={data.heatmap.cohorts}
              />
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Outcomes;
