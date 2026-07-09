import { useMemo, useState } from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { PricingModal } from './PricingModal';
import { ConsultantOnboardingWizard } from '@/components/onboarding/ConsultantOnboardingWizard';
import { QuickCreateStudentDialog } from '@/components/onboarding/QuickCreateStudentDialog';

type GateMode = 'intro' | 'onboarding' | 'locked' | null;

/**
 * Orchestrates the consultant post-signup flow:
 *   1. First login → dismissible intro pricing modal (once).
 *   2. Post-pricing → blocking 4-step onboarding wizard (once).
 *   3. Wizard finish → "Add your first student" modal (dismissible).
 *   4. Trial expired without paid subscription → blocking pricing modal.
 * Silent for non-consultants and while the hook is loading.
 */
export function TrialGate() {
  const {
    isLoading,
    isConsultant,
    status,
    isExpired,
    hasSeenIntroPricing,
    hasCompletedOnboarding,
    markIntroPricingSeen,
  } = useTrialStatus();

  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const mode = useMemo<GateMode>(() => {
    if (isLoading || !isConsultant || status === 'active') return null;
    if (isExpired) return 'locked';
    if (!hasSeenIntroPricing) return 'intro';
    if (!hasCompletedOnboarding) return 'onboarding';
    return null;
  }, [isLoading, isConsultant, status, isExpired, hasSeenIntroPricing, hasCompletedOnboarding]);

  if (mode === 'locked') {
    return (
      <PricingModal
        open
        blocking
        title="Your trial has ended"
        subtitle="Pick a plan to keep using Primrose. Your data is safe — nothing is deleted."
      />
    );
  }

  if (mode === 'intro') {
    return (
      <PricingModal
        open
        title="Welcome to Primrose"
        subtitle="You're on a 7-day free trial. Grab the founding offer while it's live — first 2 months at $19."
        onClose={() => {
          void markIntroPricingSeen();
        }}
      />
    );
  }

  if (mode === 'onboarding') {
    return (
      <ConsultantOnboardingWizard
        open
        onFinished={() => setShowQuickCreate(true)}
      />
    );
  }

  return (
    <QuickCreateStudentDialog
      open={showQuickCreate}
      onClose={() => setShowQuickCreate(false)}
    />
  );
}
