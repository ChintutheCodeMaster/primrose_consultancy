import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTrialStatus, type ConsultantOnboardingInput } from '@/hooks/useTrialStatus';

interface Props {
  open: boolean;
  onFinished: () => void;
}

const PROGRAM_OPTIONS = [
  'Undergraduate',
  "Graduate / Master's",
  'MBA',
  'Law (LLM / JD)',
  'Medicine',
  'Boarding Schools',
  'Mixed Practice',
];

const VOLUME_OPTIONS = ['1–10', '11–25', '26–50', '51–100', '100+'];

const DESTINATION_OPTIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Europe',
  'Australia',
  'Multiple Destinations',
];

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Welcome',
  2: 'Profile',
  3: 'Practice',
  4: 'First Student',
};

interface FormState extends ConsultantOnboardingInput {
  first_name: string;
  last_name: string;
  company_name: string;
  website: string;
  primary_program: string;
  students_per_year: string;
  primary_destinations: string;
}

const emptyForm: FormState = {
  first_name: '',
  last_name: '',
  company_name: '',
  website: '',
  primary_program: '',
  students_per_year: '',
  primary_destinations: '',
};

/** Top step tracker: numbered circles + labels + connecting lines. */
function StepTracker({ step }: { step: Step }) {
  const steps: Step[] = [1, 2, 3, 4];
  return (
    <div className="w-full max-w-3xl mx-auto flex items-center justify-between px-2">
      {steps.map((n, i) => {
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  active
                    ? 'bg-slate-900 text-white'
                    : done
                      ? 'bg-slate-900/80 text-white'
                      : 'bg-slate-200/70 text-slate-400',
                )}
              >
                {n}
              </div>
              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  active || done ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {STEP_LABELS[n]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 mx-3 h-px bg-slate-300/70" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(15,23,42,0.15)] p-8 sm:p-10 animate-fade-in">
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 h-auto text-sm font-semibold tracking-wide uppercase disabled:bg-slate-300"
    >
      {children}
    </Button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-slate-500 hover:text-slate-900 transition disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ConsultantOnboardingWizard({ open, onFinished }: Props) {
  const { saveConsultantOnboarding } = useTrialStatus();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const canContinueStep2 = useMemo(
    () => form.first_name.trim().length > 0 && form.last_name.trim().length > 0,
    [form.first_name, form.last_name],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const finish = async () => {
    setSaving(true);
    try {
      await saveConsultantOnboarding(form);
      onFinished();
    } catch (e) {
      console.error(e);
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-rose-50 via-orange-50/60 to-amber-50 animate-fade-in">
      {/* Logo top-left */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-rose-200" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-slate-900">Primrose IEC</span>
      </div>

      {/* Step tracker */}
      <div className="pt-16 sm:pt-20 pb-10 px-6">
        <StepTracker step={step} />
      </div>

      {/* Card */}
      <div className="px-4 sm:px-6 pb-24">
        {step === 1 && (
          <StepCard>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Welcome to Primrose IEC
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              Your AI-powered admissions workspace is almost ready. Let&apos;s personalize your
              experience so you can start supporting students faster and deliver exceptional
              admissions guidance.
            </p>
            <div className="mt-10 flex justify-end">
              <PrimaryButton onClick={() => setStep(2)}>
                Get Started <ChevronRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Tell us about yourself
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              This information personalizes your workspace.
            </p>

            <div className="mt-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-xs font-medium text-slate-600">
                    First Name<span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => update('first_name', e.target.value)}
                    placeholder="Ada"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-xs font-medium text-slate-600">
                    Last Name<span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => update('last_name', e.target.value)}
                    placeholder="Lovelace"
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_name" className="text-xs font-medium text-slate-600">
                  Company / Consultancy Name{' '}
                  <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                  placeholder="Lovelace Admissions"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="website" className="text-xs font-medium text-slate-600">
                  Website{' '}
                  <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="https://…"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <SecondaryButton onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </SecondaryButton>
              <PrimaryButton disabled={!canContinueStep2} onClick={() => setStep(3)}>
                Continue <ChevronRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Tell us about your practice
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              We&apos;ll tailor Primrose to the students and applications you support.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  What do you primarily help students apply for?
                </Label>
                <Select
                  value={form.primary_program}
                  onValueChange={(v) => update('primary_program', v)}
                >
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">
                  How many students do you typically work with each year?
                </Label>
                <Select
                  value={form.students_per_year}
                  onValueChange={(v) => update('students_per_year', v)}
                >
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLUME_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Where do most of your students apply?{' '}
                  <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </Label>
                <Select
                  value={form.primary_destinations}
                  onValueChange={(v) => update('primary_destinations', v)}
                >
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <SecondaryButton onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </SecondaryButton>
              <PrimaryButton onClick={() => setStep(4)}>
                Continue <ChevronRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Your workspace is ready.
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              Everything has been configured for your practice. Let&apos;s create your first
              student and experience how Primrose streamlines admissions consulting.
            </p>

            <div className="mt-10 flex items-center justify-between">
              <SecondaryButton onClick={() => setStep(3)} disabled={saving}>
                <ChevronLeft className="h-4 w-4" /> Back
              </SecondaryButton>
              <PrimaryButton onClick={finish} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Create My First Student <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </PrimaryButton>
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
}
