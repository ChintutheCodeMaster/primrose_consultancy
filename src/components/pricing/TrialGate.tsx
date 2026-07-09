import { useMemo } from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { PricingModal } from './PricingModal';

/**
 * Renders the two consultant-lifecycle popups in one place:
 *   1. First login post-registration → dismissible intro pricing modal (once).
 *   2. Trial expired without an active subscription → blocking pricing modal.
 * Only ever renders for consultants; silent for other roles or while loading.
 */
export function TrialGate() {
  const {
    isLoading,
    isConsultant,
    status,
    isExpired,
    hasSeenIntroPricing,
    markIntroPricingSeen,
  } = useTrialStatus();

  const mode = useMemo<'intro' | 'locked' | null>(() => {
    if (isLoading || !isConsultant || status === 'active') return null;
    if (isExpired) return 'locked';
    if (!hasSeenIntroPricing) return 'intro';
    return null;
  }, [isLoading, isConsultant, status, isExpired, hasSeenIntroPricing]);

  if (!mode) return null;

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
