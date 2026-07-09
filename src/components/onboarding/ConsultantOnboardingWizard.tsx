import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap, Sparkles, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

function ProgressDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step
              ? 'w-8 bg-gradient-to-r from-violet-600 to-rose-500'
              : n < step
                ? 'w-4 bg-violet-300'
                : 'w-4 bg-slate-200'
          }`}
        />
      ))}
    </div>
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

  return (
    <Dialog open={open} onOpenChange={() => { /* blocking */ }}>
      <DialogContent
        hideClose
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-xl p-0 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-rose-50 border-none"
      >
        <div className="px-7 sm:px-10 pt-9 pb-8">
          <ProgressDots step={step} />

          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/30 mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'Sora, Inter, sans-serif' }}
              >
                Welcome to Primrose IEC
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Your AI-powered admissions workspace is almost ready. Let&apos;s personalize your
                experience so you can start supporting students faster and deliver exceptional
                admissions guidance.
              </p>
              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="mt-7 gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/25"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'Sora, Inter, sans-serif' }}
                >
                  Tell us about yourself
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This information personalizes your workspace.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name" className="text-xs font-medium">
                      First Name<span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => update('first_name', e.target.value)}
                      placeholder="Ada"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-xs font-medium">
                      Last Name<span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => update('last_name', e.target.value)}
                      placeholder="Lovelace"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_name" className="text-xs font-medium text-muted-foreground">
                    Company / Consultancy Name <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => update('company_name', e.target.value)}
                    placeholder="Lovelace Admissions"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-xs font-medium text-muted-foreground">
                    Website <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="https://…"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canContinueStep2}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-md shadow-violet-500/25"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'Sora, Inter, sans-serif' }}
                >
                  Tell us about your practice
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ll tailor Primrose to the students and applications you support.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-medium">
                    What do you primarily help students apply for?
                  </Label>
                  <Select
                    value={form.primary_program}
                    onValueChange={(v) => update('primary_program', v)}
                  >
                    <SelectTrigger className="mt-1.5">
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
                  <Label className="text-xs font-medium">
                    How many students do you typically work with each year?
                  </Label>
                  <Select
                    value={form.students_per_year}
                    onValueChange={(v) => update('students_per_year', v)}
                  >
                    <SelectTrigger className="mt-1.5">
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
                  <Label className="text-xs font-medium text-muted-foreground">
                    Where do most of your students apply?{' '}
                    <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Select
                    value={form.primary_destinations}
                    onValueChange={(v) => update('primary_destinations', v)}
                  >
                    <SelectTrigger className="mt-1.5">
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

              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-md shadow-violet-500/25"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-5">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'Sora, Inter, sans-serif' }}
              >
                Your workspace is ready.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Everything has been configured for your practice. Let&apos;s create your first
                student and experience how Primrose streamlines admissions consulting.
              </p>

              <Button
                onClick={finish}
                disabled={saving}
                size="lg"
                className="mt-7 gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/25"
              >
                <UserPlus className="h-4 w-4" /> Create My First Student
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="mt-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(3)}
                  disabled={saving}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
