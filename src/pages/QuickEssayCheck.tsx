import { Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JourneyPrimroseLab } from '@/components/journey/JourneyPrimroseLab';

/**
 * Consultant-side quick essay analyzer. Reuses the same `lab-feedback` edge
 * function powering the student Primrose Lab so the score bands, dimension
 * colors, and suggestions are identical — just without any student context.
 */
export default function QuickEssayCheck() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-6 sm:p-7 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-violet-200/70 px-3 py-1 text-xs font-medium text-violet-700 mb-3 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Quick check
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'Sora, Inter, sans-serif' }}
          >
            Check a student essay quickly with AI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            For a more in-depth and personal analysis, ask the student to submit the essay through
            their workspace — we&apos;ll provide tailored feedback for them there.
          </p>
        </div>

        <JourneyPrimroseLab />
      </div>
    </MainLayout>
  );
}
