import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export const STRIPE_PROFESSIONAL_URL = 'https://buy.stripe.com/4gM4gA6B75vpepi9im5Vu08';
export const STRIPE_TEAM_URL = 'https://buy.stripe.com/aFa6oIf7D4rl94Y2TY5Vu09';

interface PricingModalProps {
  open: boolean;
  /** When true, backdrop click / escape / close button are disabled. */
  blocking?: boolean;
  /** Copy shown at the top. Falls back to a friendly default. */
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

const TIERS = [
  {
    name: 'Professional',
    price: '$19',
    fullPrice: '$49',
    cadence: '/ consultant / month',
    promo: 'First month special',
    tagline: 'Everything a solo IEC needs to run a full practice.',
    highlight: true,
    href: STRIPE_PROFESSIONAL_URL,
    cta: 'Get started — $19',
    features: [
      'Unlimited students & alumni',
      'Digital engagement agreements',
      'Tuition calculator & university list tracker',
      'AI assistant & analytics dashboard',
      'Student portal with essay exchange',
    ],
  },
  {
    name: 'Team',
    price: '$129',
    fullPrice: null as string | null,
    cadence: '/ consultant / month',
    promo: null as string | null,
    tagline: 'For multi-consultant firms and collaborations.',
    highlight: false,
    href: STRIPE_TEAM_URL,
    cta: 'Get started — $129',
    features: [
      'Everything in Professional',
      'Multiple consultants & role management',
      'Shared student assignments',
      'Priority onboarding & support',
    ],
  },
];

export function PricingModal({
  open,
  blocking = false,
  title,
  subtitle,
  onClose,
}: PricingModalProps) {
  const handleOpenChange = (next: boolean) => {
    if (blocking) return;
    if (!next) onClose?.();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-rose-50 border-none"
        onPointerDownOutside={(e) => blocking && e.preventDefault()}
        onEscapeKeyDown={(e) => blocking && e.preventDefault()}
        hideClose={blocking}
      >
        <div className="px-6 sm:px-8 pt-8 pb-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-violet-200/70 px-3 py-1 text-xs font-medium text-violet-700 mb-3 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Founding consultant pricing
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'Sora, Inter, sans-serif' }}
            >
              {title ?? 'Welcome to Primrose'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle ??
                'Pick the plan that fits your practice. Special offer: first 2 months at only $19.'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border bg-white/85 backdrop-blur p-5 flex flex-col shadow-sm ${
                  tier.highlight
                    ? 'border-violet-400/70 ring-1 ring-violet-300/40 shadow-violet-200/40'
                    : 'border-border/60'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-rose-500 text-white px-2.5 py-0.5 text-[10px] font-semibold shadow">
                    Most popular
                  </div>
                )}
                <div className="text-[11px] uppercase tracking-wide text-violet-700 font-semibold">
                  {tier.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                  {tier.fullPrice && (
                    <span className="text-base text-muted-foreground line-through mr-1">
                      {tier.fullPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">{tier.cadence}</span>
                </div>
                {tier.promo && (
                  <p className="mt-0.5 text-[11px] font-medium text-violet-700">{tier.promo}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{tier.tagline}</p>
                <ul className="mt-3 space-y-1.5 text-xs flex-1">
                  {tier.features.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{line}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white hover:from-violet-700 hover:to-rose-600'
                      : 'border border-border bg-background hover:bg-muted'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-muted-foreground">
              Prices in USD, billed monthly. Cancel anytime.
            </p>
            {blocking ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Log out
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onClose?.()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Maybe later
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
