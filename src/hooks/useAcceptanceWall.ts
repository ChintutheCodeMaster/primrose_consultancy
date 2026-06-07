import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AcceptanceTile {
  id: string;
  university: string;
  studentName: string;
  initials: string;
  country?: string | null;
  date: string;
  colorIndex: number;
}

const TILE_PALETTE = [
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-violet-600',
  'from-lime-500 to-green-600',
  'from-cyan-500 to-teal-600',
  'from-red-500 to-rose-600',
  'from-yellow-500 to-amber-600',
];

function hashIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % TILE_PALETTE.length;
}

export function tileGradient(idx: number): string {
  return TILE_PALETTE[idx % TILE_PALETTE.length];
}

export function useAcceptanceWall() {
  return useQuery<AcceptanceTile[]>({
    queryKey: ['acceptance-wall'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accepted_universities')
        .select('id, name, country, created_at, students!inner(name)')
        .order('created_at', { ascending: false })
        .limit(80);
      if (error) throw error;

      return (data ?? []).map((row: any) => {
        const studentName: string = row.students?.name || 'Student';
        const initials = studentName
          .split(/\s+/)
          .map((p: string) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return {
          id: row.id,
          university: row.name || 'University',
          studentName,
          initials: initials || '★',
          country: row.country,
          date: row.created_at,
          colorIndex: hashIndex(row.name || studentName),
        };
      });
    },
    staleTime: 60_000,
  });
}
