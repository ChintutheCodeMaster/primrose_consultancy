import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CountryOption {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useCountryOptions() {
  const { data: countryOptions = [] } = useQuery({
    queryKey: ['country-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as CountryOption[];
    },
  });

  // Return country names with "אחר" at the end
  const options = countryOptions.map(c => c.name);
  if (!options.includes('אחר')) {
    options.push('אחר');
  }
  
  return options;
}

// Hook to get all countries (including inactive) for the settings page
export function useAllCountryOptions() {
  return useQuery({
    queryKey: ['country-options-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_options')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as CountryOption[];
    },
  });
}
