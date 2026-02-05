import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SourceOption {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useSourceOptions() {
  const { data: sourceOptions = [] } = useQuery({
    queryKey: ['source-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('source_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SourceOption[];
    },
  });

  // Return source names with "אחר" at the end
  const options = sourceOptions.map(s => s.name);
  if (!options.includes('אחר')) {
    options.push('אחר');
  }
  
  return options;
}

// Hook to get all sources (including inactive) for the settings page
export function useAllSourceOptions() {
  return useQuery({
    queryKey: ['source-options-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('source_options')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SourceOption[];
    },
  });
}
