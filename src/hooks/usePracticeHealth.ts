import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PracticeHealth {
  activeStudents: number;
  newStudentsMonth: number;
  pipelineValue: number;
  collectedMTD: number;
  acceptancesYTD: number;
  scholarshipsCount: number;
  unsignedAgreements: number;
  upcomingDeadlines: number;
  coldLeads: number;
  unpaidStudents: number;
  topUniversities: { name: string; count: number }[];
}

export function usePracticeHealth() {
  return useQuery<PracticeHealth>({
    queryKey: ['practice-health'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const [students, accepted, leads, agreements] = await Promise.all([
        supabase.from('students').select('id, package_cost, amount_paid, signed_agreement, is_paid, created_at, payment_date, did_not_continue, graduation_year').eq('did_not_continue', false),
        supabase.from('accepted_universities').select('name, created_at, student_id'),
        supabase.from('leads').select('id, created_at, last_contact_at').eq('did_not_continue', false),
        supabase.from('student_agreements').select('id, status, created_at'),
      ]);

      const allStudents = students.data ?? [];
      const allAccepted = accepted.data ?? [];
      const allLeads = leads.data ?? [];

      const active = allStudents.filter((s) => !s.graduation_year);
      const newThisMonth = allStudents.filter((s) => s.created_at && s.created_at >= startOfMonth);
      const collectedMTD = allStudents
        .filter((s) => s.payment_date && new Date(s.payment_date).toISOString() >= startOfMonth)
        .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
      const pipeline = active.reduce((sum, s) => sum + Math.max(0, Number(s.package_cost || 0) - Number(s.amount_paid || 0)), 0);
      const acceptancesYTD = allAccepted.filter((a) => a.created_at && a.created_at >= startOfYear).length;
      const unsigned = active.filter((s) => !s.signed_agreement).length;
      const unpaid = active.filter((s) => !s.is_paid && Number(s.package_cost || 0) > 0).length;
      const cold = allLeads.filter((l) => {
        const last = l.last_contact_at || l.created_at;
        return last && last < tenDaysAgo;
      }).length;

      // Top universities
      const uniCounts: Record<string, number> = {};
      allAccepted.forEach((a) => {
        if (a.name) uniCounts[a.name] = (uniCounts[a.name] || 0) + 1;
      });
      const topUniversities = Object.entries(uniCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));

      // Upcoming deadlines (from student_calendar_events)
      const { data: events } = await supabase
        .from('student_calendar_events')
        .select('id, event_date')
        .gte('event_date', now.toISOString())
        .lte('event_date', in14Days);

      return {
        activeStudents: active.length,
        newStudentsMonth: newThisMonth.length,
        pipelineValue: pipeline,
        collectedMTD,
        acceptancesYTD,
        scholarshipsCount: 0,
        unsignedAgreements: unsigned,
        upcomingDeadlines: events?.length ?? 0,
        coldLeads: cold,
        unpaidStudents: unpaid,
        topUniversities,
      };
    },
    staleTime: 60_000,
  });
}
