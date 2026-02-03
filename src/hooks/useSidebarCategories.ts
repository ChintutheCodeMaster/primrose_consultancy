import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SidebarCategory {
  id: string;
  category_type: 'leads' | 'past_clients' | 'did_not_continue';
  year_value: string;
  display_label: string;
  sort_order: number;
  is_active: boolean;
}

export function useSidebarCategories() {
  return useQuery({
    queryKey: ['sidebar-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sidebar_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return (data || []) as SidebarCategory[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useCategoriesByType(categoryType: 'leads' | 'past_clients' | 'did_not_continue') {
  const { data: categories = [], ...rest } = useSidebarCategories();
  
  return {
    ...rest,
    data: categories.filter(c => c.category_type === categoryType),
  };
}
