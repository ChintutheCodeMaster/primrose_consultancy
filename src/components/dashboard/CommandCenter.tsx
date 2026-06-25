import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { AIDailyBrief } from './AIDailyBrief';
import { AcceptanceWall } from './AcceptanceWall';
import { PracticeHealthCards } from './PracticeHealthCards';
import { NeedsAttention } from './NeedsAttention';
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
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Prefer advisor name (set on consultant signup), then admin name, then auth metadata.
      const [{ data: advisor }, { data: admin }] = await Promise.all([
        supabase.from('advisors').select('name').eq('user_id', user.id).maybeSingle(),
        supabase.from('admins' as any).select('name').eq('user_id', user.id).maybeSingle(),
      ]);
      const raw =
        (advisor as any)?.name ||
        (admin as any)?.name ||
        (user.user_metadata as any)?.full_name ||
        '';
      const first = String(raw).trim().split(/\s+/)[0] || '';
      setFirstName(first);
    })();
  }, []);

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
      console.error('[Export to Excel failed]', e);
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Export Error',
        description: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-violet-50/40 to-amber-50/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_30px_-12px_hsl(263_70%_50%/0.15)] animate-slide-up">
          <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full bg-violet-300/25 blur-3xl animate-float" />
          <div className="absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">{greeting}</p>
              <h1
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-gradient-primary"
                style={{ fontFamily: 'Sora, Inter, sans-serif' }}
              >
                Hi{firstName ? `, ${firstName}` : ''} <span className="inline-block animate-float">👋</span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Here's how your practice is doing today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all press-soft">
                <Link to="/outcomes">
                  <Trophy className="mr-1.5 h-4 w-4" />
                  Outcomes
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl bg-white/70 backdrop-blur press-soft">
                <Link to="/ai-chat">
                  <Sparkles className="mr-1.5 h-4 w-4 text-amber-500" />
                  Ask Rose
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="rounded-xl bg-white/70 backdrop-blur press-soft">
                {isExporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Export to Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Inbound / signal banners */}
        <div className="animate-slide-up stagger-1"><NewWebsiteLeadsBanner /></div>
        <div className="animate-slide-up stagger-2"><RecentlySignedAgreements /></div>

        {/* AI Brief */}
        {briefStats && <div className="animate-slide-up stagger-3"><AIDailyBrief stats={briefStats} /></div>}

        {/* KPI row */}
        <div className="animate-slide-up stagger-4"><PracticeHealthCards data={data} /></div>

        {/* Acceptance Wall (hero) */}
        <div className="animate-slide-up stagger-5"><AcceptanceWall /></div>

        {/* Deadline radar */}
        <div className="animate-slide-up stagger-6"><DeadlineRadar /></div>

        {/* Two-column */}
        <div className="grid gap-6 lg:grid-cols-2 animate-slide-up stagger-6">
          <NeedsAttention data={data} />
          <PendingPaymentProjects />
        </div>
      </div>
    </MainLayout>
  );
}
