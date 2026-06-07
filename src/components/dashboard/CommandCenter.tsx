import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AIDailyBrief } from './AIDailyBrief';
import { AcceptanceWall } from './AcceptanceWall';
import { PracticeHealthCards } from './PracticeHealthCards';
import { NeedsAttention } from './NeedsAttention';
import { TopUniversities } from './TopUniversities';
import { usePracticeHealth } from '@/hooks/usePracticeHealth';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Sparkles } from 'lucide-react';

export function CommandCenter() {
  const { data } = usePracticeHealth();

  const briefStats = data && {
    active_students: data.activeStudents,
    new_students_this_month: data.newStudentsMonth,
    acceptances_ytd: data.acceptancesYTD,
    pipeline_usd: Math.round(data.pipelineValue),
    collected_this_month_usd: Math.round(data.collectedMTD),
    unsigned_agreements: data.unsignedAgreements,
    cold_leads_over_10_days: data.coldLeads,
    upcoming_deadlines_14d: data.upcomingDeadlines,
    unpaid_students: data.unpaidStudents,
    top_universities: data.topUniversities.slice(0, 5).map((u) => `${u.name} (${u.count})`),
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{greeting}.</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Command Center</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/ai-chat">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Ask Rose
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/classic-dashboard">
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                Classic view
              </Link>
            </Button>
          </div>
        </div>

        {/* AI Brief */}
        {briefStats && <AIDailyBrief stats={briefStats} />}

        {/* KPI row */}
        <PracticeHealthCards data={data} />

        {/* Acceptance Wall (hero) */}
        <AcceptanceWall />

        {/* Two-column */}
        <div className="grid gap-6 lg:grid-cols-2">
          <NeedsAttention data={data} />
          <TopUniversities data={data} />
        </div>
      </div>
    </MainLayout>
  );
}
