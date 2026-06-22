import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole =
  | 'student'
  | 'consultant'
  | 'parent'
  | 'counselor'
  | 'admin'
  | 'principal'
  | 'teacher';

interface RoleState {
  role: AppRole | null;
  isLoading: boolean;
}

// Reads from public.user_roles. Noga's default client is pinned to the
// `noga` schema, so we route through .schema('public') for shared identity.
export const useCurrentRole = (): RoleState => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setRole(null);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .schema('public' as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole(error || !data ? null : (data.role as AppRole));
        setIsLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { role, isLoading };
};
