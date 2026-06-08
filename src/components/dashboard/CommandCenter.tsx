import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AIDailyBrief } from './AIDailyBrief';
import { AcceptanceWall } from './AcceptanceWall';
import { PracticeHealthCards } from './PracticeHealthCards';
import { NeedsAttention } from './NeedsAttention';
import { TopUniversities } from './TopUniversities';
import { DeadlineRadar } from './DeadlineRadar';
import { RecentlySignedAgreements } from './RecentlySignedAgreements';
import { NewWebsiteLeadsBanner } from './NewWebsiteLeadsBanner';
import { PendingPaymentProjects } from './PendingPaymentProjects';
import { usePracticeHealth } from '@/hooks/usePracticeHealth';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sparkles, Trophy } from 'lucide-react';
import { exportAllDataToExcel } from '@/lib/exportToExcel';
import { toast } from '@/hooks/use-toast';

export function CommandCenter() {
  const { data } = usePracticeHealth();
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const fileName = await exportAllDataToExcel();
      toast({ title: 'File downloaded', description: fileName });
    } catch (e) {
      console.error(e);
      toast({ title: 'Export Error', description: 'Could not export data', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{greeting}.</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/outcomes">
                <Trophy className="mr-1.5 h-4 w-4" />
                Outcomes
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/ai-chat">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Ask Rose
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Inbound / signal banners */}
        <NewWebsiteLeadsBanner />
        <RecentlySignedAgreements />

        {/* AI Brief */}
        {briefStats && <AIDailyBrief stats={briefStats} />}

        {/* KPI row */}
        <PracticeHealthCards data={data} />

        {/* Acceptance Wall (hero) */}
        <AcceptanceWall />

        {/* Deadline radar */}
        <DeadlineRadar />

        {/* Two-column */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <NeedsAttention data={data} />
            <PendingPaymentProjects />
          </div>
          <TopUniversities data={data} />
        </div>
      </div>
    </MainLayout>
  );
}
