import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OutcomesCohort {
  cohort: string; // e.g. "2024"
  leads: number;
  signed: number;
  active: number;
  accepted: number;
  enrolled: number;
  collectedUSD: number;
}

export interface UniversityCohortCell {
  university: string;
  cohort: string;
  count: number;
}

export interface OutcomesData {
  cohorts: OutcomesCohort[];
  heatmap: {
    universities: string[];
    cohorts: string[];
    cells: Record<string, Record<string, number>>; // [university][cohort]
  };
  topUniversities: { name: string; count: number }[];
  acceptanceList: { university: string; state: string | null; cohort: string }[];
  totals: {
    students: number;
    accepted: number;
    enrolled: number;
    scholarships: number;
    collectedUSD: number;
    avgPackageUSD: number;
  };
}

function yearOf(d: string | null): string | null {
  if (!d) return null;
  const y = new Date(d).getFullYear();
  return Number.isFinite(y) ? String(y) : null;
}

export function useOutcomesData() {
  return useQuery<OutcomesData>({
    queryKey: ['outcomes-data'],
    queryFn: async () => {
      const [studentsRes, acceptedRes, leadsRes, scholarshipsRes, collegesRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, created_at, signed_agreement, did_not_continue, amount_paid, package_cost, graduation_year, status, payment_date'),
        supabase.from('accepted_universities').select('name, student_id, created_at, study_year'),
        supabase.from('leads').select('id, created_at, leads_year, did_not_continue'),
        supabase.from('student_scholarships').select('id, student_id'),
        supabase.from('college_reference').select('name, state'),
      ]);

      const students = studentsRes.data ?? [];
      const accepted = acceptedRes.data ?? [];
      const leads = leadsRes.data ?? [];
      const colleges = collegesRes.data ?? [];
      const stateByName = new Map<string, string | null>(
        colleges.map((c) => [c.name.trim().toLowerCase(), c.state ?? null])
      );
      const scholarships = scholarshipsRes.data ?? [];

      // Build cohort map from graduation_year (fallback to created_at year)
      const cohortMap = new Map<string, OutcomesCohort>();
      const ensure = (c: string) => {
        if (!cohortMap.has(c))
          cohortMap.set(c, { cohort: c, leads: 0, signed: 0, active: 0, accepted: 0, enrolled: 0, collectedUSD: 0 });
        return cohortMap.get(c)!;
      };

      for (const s of students) {
        const c = s.graduation_year || yearOf(s.created_at) || 'Unknown';
        const row = ensure(c);
        if (s.signed_agreement) row.signed += 1;
        if (!s.did_not_continue) row.active += 1;
        if (s.status === 'enrolled' || s.status === 'graduated') row.enrolled += 1;
        row.collectedUSD += Number(s.amount_paid ?? 0);
      }

      for (const a of accepted) {
        const student = students.find((s) => s.id === a.student_id);
        const c = a.study_year || (student?.graduation_year ?? yearOf(a.created_at)) || 'Unknown';
        ensure(c).accepted += 1;
      }

      for (const l of leads) {
        const c = l.leads_year || yearOf(l.created_at) || 'Unknown';
        ensure(c).leads += 1;
      }

      const cohorts = Array.from(cohortMap.values())
        .filter((c) => c.cohort !== 'Unknown')
        .sort((a, b) => b.cohort.localeCompare(a.cohort));

      // Heatmap: university × cohort
      const cells: Record<string, Record<string, number>> = {};
      const uniCounts = new Map<string, number>();
      const cohortSet = new Set<string>();
      for (const a of accepted) {
        if (!a.name) continue;
        const student = students.find((s) => s.id === a.student_id);
        const c = a.study_year || (student?.graduation_year ?? yearOf(a.created_at)) || 'Unknown';
        if (c === 'Unknown') continue;
        cohortSet.add(c);
        const name = a.name.trim();
        uniCounts.set(name, (uniCounts.get(name) ?? 0) + 1);
        cells[name] ??= {};
        cells[name][c] = (cells[name][c] ?? 0) + 1;
      }
      const topUniversities = Array.from(uniCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      const universities = topUniversities.slice(0, 15).map((u) => u.name);
      const sortedCohorts = Array.from(cohortSet).sort((a, b) => b.localeCompare(a)).slice(0, 6).reverse();

      const totalPackages = students.filter((s) => Number(s.package_cost ?? 0) > 0);
      const avgPackage = totalPackages.length
        ? totalPackages.reduce((sum, s) => sum + Number(s.package_cost ?? 0), 0) / totalPackages.length
        : 0;

      const acceptanceList = accepted
        .filter((a) => a.name)
        .map((a) => {
          const student = students.find((s) => s.id === a.student_id);
          const c = a.study_year || (student?.graduation_year ?? yearOf(a.created_at)) || 'Unknown';
          const nm = a.name.trim();
          return { university: nm, state: stateByName.get(nm.toLowerCase()) ?? null, cohort: c };
        });

      return {
        cohorts,
        heatmap: { universities, cohorts: sortedCohorts, cells },
        topUniversities,
        acceptanceList,
        totals: {
          students: students.filter((s) => !s.did_not_continue).length,
          accepted: accepted.length,
          enrolled: students.filter((s) => s.status === 'enrolled' || s.status === 'graduated').length,
          scholarships: scholarships.length,
          collectedUSD: students.reduce((sum, s) => sum + Number(s.amount_paid ?? 0), 0),
          avgPackageUSD: avgPackage,
        },
      };
    },
    staleTime: 60_000,
  });
}
