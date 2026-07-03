import { useEffect } from 'react';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        console.log('[Dashboard] no active session');
        return;
      }

      const [advisorRes, adminRes, roleRes] = await Promise.all([
        supabase.from('advisors').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('admins' as any).select('*').eq('user_id', user.id).maybeSingle(),
        supabase.schema('public' as any).from('user_roles').select('role').eq('user_id', user.id),
      ]);

      console.log('[Dashboard] logged-in user', {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        provider: user.app_metadata?.provider,
        roles: roleRes.data?.map((r: any) => r.role) ?? [],
        advisor: advisorRes.data ?? null,
        admin: adminRes.data ?? null,
      });
    })();
  }, []);

  return <CommandCenter />;
};

export default Dashboard;
