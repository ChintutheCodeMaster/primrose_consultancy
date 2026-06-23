import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NogaIdentity {
  loading: boolean;
  authUserId: string | null;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
  advisorId: string | null;
  advisorName: string | null;
  advisorEmail: string | null;
}

const EMPTY: NogaIdentity = {
  loading: true,
  authUserId: null,
  studentId: null,
  studentName: null,
  studentEmail: null,
  advisorId: null,
  advisorName: null,
  advisorEmail: null,
};

export function useNogaIdentity(): NogaIdentity {
  const [identity, setIdentity] = useState<NogaIdentity>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setIdentity({ ...EMPTY, loading: false });
        return;
      }

      const [studentResult, advisorResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, name, email')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('advisors')
          .select('id, name, email')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const student = studentResult.data as { id: string; name: string | null; email: string | null } | null;
      const advisor = advisorResult.data as { id: string; name: string | null; email: string | null } | null;

      setIdentity({
        loading: false,
        authUserId: user.id,
        studentId: student?.id ?? null,
        studentName: student?.name ?? null,
        studentEmail: student?.email ?? null,
        advisorId: advisor?.id ?? null,
        advisorName: advisor?.name ?? null,
        advisorEmail: advisor?.email ?? null,
      });
    };

    resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolve();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return identity;
}
