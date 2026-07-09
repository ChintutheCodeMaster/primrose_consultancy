import { Clock, Sparkles } from 'lucide-react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { STRIPE_PROFESSIONAL_URL } from '@/components/pricing/PricingModal';

export function TrialBanner() {
  const { isLoading, isConsultant, status, daysLeft, isExpired } = useTrialStatus();

  if (isLoading || !isConsultant || status === 'active') return null;

  const trialLabel = isExpired
    ? 'Your trial has ended'
    : `Your trial expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex flex-wrap items-center justify-end gap-2 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium backdrop-blur ${
          isExpired
            ? 'border-rose-300 bg-rose-50/90 text-rose-700'
            : 'border-violet-300 bg-white/85 text-violet-700'
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>{trialLabel}</span>
      </div>
      <a
        href={STRIPE_PROFESSIONAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-300/70 bg-gradient-to-r from-violet-600 to-rose-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:shadow-md transition"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Special offer: First 2 months at only $19
      </a>
    </div>
  );
}
