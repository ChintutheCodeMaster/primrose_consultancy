import { supabase } from '@/integrations/supabase/client';

export interface CurrentAdvisor {
  id: string | null;
  name: string;
}

/**
 * Resolves the logged-in user's noga.advisors row (if any).
 *
 * Use this for INSERTs into noga.students or noga.leads — the new RLS
 * policies require advisor_id to be set to the calling consultant's ID.
 * Admins (no advisor row) get `id = null`, which the RLS policy allows
 * through their `is_iec_admin()` clause.
 */
export async function resolveCurrentAdvisor(): Promise<CurrentAdvisor> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null, name: '' };
  const { data: advisor } = await supabase
    .from('advisors')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!advisor) return { id: null, name: '' };
  return {
    id: (advisor as any).id ?? null,
    name: (advisor as any).name ?? '',
  };
}
