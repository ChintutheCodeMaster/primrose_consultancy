import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'canceled';

export interface ConsultantOnboardingInput {
  first_name: string;
  last_name: string;
  company_name?: string | null;
  website?: string | null;
  primary_program?: string | null;
  students_per_year?: string | null;
  primary_destinations?: string | null;
}

export interface TrialStatus {
  isLoading: boolean;
  isConsultant: boolean;
  advisorId: string | null;
  status: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysLeft: number;
  isExpired: boolean;
  hasSeenIntroPricing: boolean;
  hasCompletedOnboarding: boolean;
  markIntroPricingSeen: () => Promise<void>;
  saveConsultantOnboarding: (data: ConsultantOnboardingInput) => Promise<void>;
  refresh: () => Promise<void>;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const daysBetween = (endIso: string): number => {
  const diff = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / DAY_MS));
};

export const useTrialStatus = (): TrialStatus => {
  const [state, setState] = useState<
    Omit<TrialStatus, 'markIntroPricingSeen' | 'saveConsultantOnboarding' | 'refresh'>
  >({
    isLoading: true,
    isConsultant: false,
    advisorId: null,
    status: 'trialing',
    trialStartedAt: null,
    trialEndsAt: null,
    daysLeft: 7,
    isExpired: false,
    hasSeenIntroPricing: false,
    hasCompletedOnboarding: false,
  });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState((s) => ({ ...s, isLoading: false, isConsultant: false }));
      return;
    }

    const { data: roleRow } = await supabase
      .schema('public' as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRow?.role !== 'consultant') {
      setState((s) => ({ ...s, isLoading: false, isConsultant: false }));
      return;
    }

    const { data: advisor } = await supabase
      .from('advisors')
      .select(
        'id, trial_started_at, subscription_status, has_seen_intro_pricing, has_completed_onboarding',
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (!advisor) {
      setState((s) => ({ ...s, isLoading: false, isConsultant: true }));
      return;
    }

    // Start the trial clock on first authenticated read.
    let trialStartedAt = advisor.trial_started_at;
    if (!trialStartedAt) {
      const nowIso = new Date().toISOString();
      const { data: updated } = await supabase
        .from('advisors')
        .update({ trial_started_at: nowIso })
        .eq('id', advisor.id)
        .is('trial_started_at', null)
        .select('trial_started_at')
        .maybeSingle();
      trialStartedAt = updated?.trial_started_at ?? nowIso;
    }

    const trialEndsAt = trialStartedAt
      ? new Date(new Date(trialStartedAt).getTime() + 7 * DAY_MS).toISOString()
      : null;
    const daysLeft = trialEndsAt ? daysBetween(trialEndsAt) : 0;
    const status = (advisor.subscription_status ?? 'trialing') as SubscriptionStatus;
    const isExpired = status !== 'active' && daysLeft <= 0;

    setState({
      isLoading: false,
      isConsultant: true,
      advisorId: advisor.id,
      status,
      trialStartedAt,
      trialEndsAt,
      daysLeft,
      isExpired,
      hasSeenIntroPricing: Boolean(advisor.has_seen_intro_pricing),
      hasCompletedOnboarding: Boolean(advisor.has_completed_onboarding),
    });
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, [load]);

  const markIntroPricingSeen = useCallback(async () => {
    if (!state.advisorId || state.hasSeenIntroPricing) return;
    setState((s) => ({ ...s, hasSeenIntroPricing: true }));
    await supabase
      .from('advisors')
      .update({ has_seen_intro_pricing: true })
      .eq('id', state.advisorId);
  }, [state.advisorId, state.hasSeenIntroPricing]);

  const saveConsultantOnboarding = useCallback(
    async (data: ConsultantOnboardingInput) => {
      if (!state.advisorId) {
        throw new Error(
          'We could not find your consultant profile yet. Please refresh and try again.',
        );
      }
      const fullName = `${data.first_name.trim()} ${data.last_name.trim()}`.trim();
      const payload = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        company_name: data.company_name?.trim() || null,
        website: data.website?.trim() || null,
        primary_program: data.primary_program?.trim() || null,
        students_per_year: data.students_per_year?.trim() || null,
        primary_destinations: data.primary_destinations?.trim() || null,
        has_completed_onboarding: true,
        ...(fullName ? { name: fullName } : {}),
      };
      const { data: rows, error } = await supabase
        .from('advisors')
        .update(payload)
        .eq('id', state.advisorId)
        .select('id');
      if (error) {
        console.error('saveConsultantOnboarding update failed:', error);
        throw new Error(error.message || 'Could not save your profile.');
      }
      if (!rows || rows.length === 0) {
        throw new Error(
          'Could not save your profile — RLS blocked the update. Apply the trial + onboarding migrations and try again.',
        );
      }
      setState((s) => ({ ...s, hasCompletedOnboarding: true }));
    },
    [state.advisorId],
  );

  return {
    ...state,
    markIntroPricingSeen,
    saveConsultantOnboarding,
    refresh: load,
  };
};
