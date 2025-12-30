import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Default source options
export const defaultSourceOptions = [
  'לינקדאין',
  'פייסבוק',
  'גוגל',
  'פודקאסט',
  'המלצה ממועמד עבר',
  'קהילת לימודים באנגליה',
  'אינסטגרם',
];

export function useSourceOptions() {
  const { data: existingSources = [] } = useQuery({
    queryKey: ['existing-sources'],
    queryFn: async () => {
      // Get unique sources from both leads and students
      const [leadsResult, studentsResult] = await Promise.all([
        supabase.from('leads').select('source').not('source', 'is', null),
        supabase.from('students').select('source').not('source', 'is', null),
      ]);

      const leadSources = (leadsResult.data || []).map(l => l.source).filter(Boolean);
      const studentSources = (studentsResult.data || []).map(s => s.source).filter(Boolean);
      
      return [...new Set([...leadSources, ...studentSources])];
    },
  });

  // Combine default options with existing sources, removing duplicates
  const allSources = [...new Set([...defaultSourceOptions, ...existingSources])];
  
  // Add "אחר" at the end if not already there
  const sourceOptions = allSources.filter(s => s !== 'אחר');
  sourceOptions.push('אחר');

  return sourceOptions;
}
