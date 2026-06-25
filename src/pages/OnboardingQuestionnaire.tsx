import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Loader2, Sparkles, Star, Trophy } from 'lucide-react';
import { steps } from '@/data/onboarding/steps';
import type { Question } from '@/data/onboarding/types';

// ===========================================================================
// OnboardingQuestionnaire (Noga)
// ---------------------------------------------------------------------------
// Mirrors TPR's multi-step questionnaire, but rebuilt with Noga's design
// language (violet mesh, soft cards). All answers persist to
// noga.onboarding_answers and the DB trigger sync_profile_from_onboarding_trg
// then auto-syncs the relevant columns into noga.user_profiles — so a single
// canonical profile row stays up to date as the user answers.
// ===========================================================================

type Answers = Record<string, any>;

function getQuestionText(question: Question, answers: Answers): string {
  return typeof question.question === 'function' ? question.question(answers) : question.question;
}

// ---------------------------------------------------------------------------
// Inline question renderer — handles every question type used in our 6 steps
// ---------------------------------------------------------------------------
interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (next: any) => void;
}

function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  switch (question.type) {
    case 'text': {
      const v = (value as string) ?? '';
      return (
        <div className="space-y-1.5">
          <Textarea
            value={v}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            rows={5}
            className="resize-none rounded-xl border-violet-200/70 bg-white/70 focus-visible:border-violet-400"
          />
          {question.maxLength ? (
            <p className="text-right text-xs text-muted-foreground">
              {v.length}/{question.maxLength}
            </p>
          ) : null}
        </div>
      );
    }

    case 'select': {
      const v = (value as string) ?? '';
      return (
        <Select value={v} onValueChange={(next) => onChange(next)}>
          <SelectTrigger className="h-12 rounded-xl border-violet-200/70 bg-white/70">
            <SelectValue placeholder="Choose one…" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {question.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case 'multiple': {
      const selected: string[] = Array.isArray(value?.choices)
        ? value.choices
        : Array.isArray(value)
          ? value
          : [];
      const followUp: string = typeof value?.note === 'string' ? value.note : '';
      const toggle = (opt: string) => {
        const isSel = selected.includes(opt);
        let next: string[];
        if (isSel) next = selected.filter((x) => x !== opt);
        else if (selected.length >= question.maxChoices) next = selected;
        else next = [...selected, opt];
        onChange({ choices: next, note: followUp });
      };
      return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Pick up to {question.maxChoices}. {selected.length}/{question.maxChoices} chosen.
          </p>
          <div className="flex flex-wrap gap-2">
            {question.options.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all press-soft',
                    isSel
                      ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'border-violet-200/70 bg-white/80 text-foreground hover:border-violet-400'
                  )}
                >
                  {isSel ? <Check className="h-3.5 w-3.5" /> : null}
                  {opt}
                </button>
              );
            })}
          </div>
          {question.followUp ? (
            <Textarea
              value={followUp}
              onChange={(e) => onChange({ choices: selected, note: e.target.value })}
              placeholder={question.followUp.placeholder}
              maxLength={question.followUp.maxLength}
              rows={3}
              className="rounded-xl border-violet-200/70 bg-white/70 focus-visible:border-violet-400"
            />
          ) : null}
        </div>
      );
    }

    case 'conditional': {
      const v: { choice?: string; note?: string } = value ?? {};
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {question.options.map((opt) => {
              const isSel = v.choice === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ choice: opt, note: opt === question.followUp.condition ? v.note ?? '' : '' })}
                  className={cn(
                    'rounded-full border px-5 py-2 text-sm font-medium transition-all press-soft',
                    isSel
                      ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'border-violet-200/70 bg-white/80 text-foreground hover:border-violet-400'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {v.choice === question.followUp.condition ? (
            <Textarea
              value={v.note ?? ''}
              onChange={(e) => onChange({ choice: v.choice, note: e.target.value })}
              placeholder={question.followUp.placeholder}
              maxLength={question.followUp.maxLength}
              rows={4}
              className="rounded-xl border-violet-200/70 bg-white/70 focus-visible:border-violet-400"
            />
          ) : null}
        </div>
      );
    }

    case 'age_cards': {
      const v = (value as string) ?? '';
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {question.options.map((opt) => {
            const isSel = v === opt.range;
            return (
              <button
                key={opt.range}
                type="button"
                onClick={() => onChange(opt.range)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all press-soft',
                  isSel
                    ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-500/15'
                    : 'border-violet-200/70 bg-white/80 hover:border-violet-400'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    isSel ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'
                  )}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{opt.range}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case 'gender_cards': {
      const v = (value as string) ?? '';
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {question.options.map((opt) => {
            const isSel = v === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all press-soft',
                  isSel
                    ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-500/15'
                    : 'border-violet-200/70 bg-white/80 hover:border-violet-400'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold',
                    isSel ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'
                  )}
                >
                  {opt.value[0]}
                </div>
                <span className="text-sm font-medium text-foreground">{opt.value}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case 'combined_cards': {
      const v: Record<string, any> = value ?? {};
      return (
        <div className="space-y-6">
          {question.subQuestions.map((sub) => (
            <div key={sub.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{getQuestionText(sub as Question, v)}</p>
              <QuestionRenderer
                question={sub as Question}
                value={v[sub.id]}
                onChange={(next) => onChange({ ...v, [sub.id]: next })}
              />
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Table-of-contents sidebar (left rail)
// ---------------------------------------------------------------------------
function StepsTOC({
  current,
  answersByStep,
  onJump,
}: {
  current: number;
  answersByStep: boolean[];
  onJump: (i: number) => void;
}) {
  return (
    <aside className="space-y-2">
      <div className="rounded-2xl border border-violet-200/60 bg-white/70 p-4 backdrop-blur shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Your Journey</p>
        <ol className="mt-3 space-y-1.5">
          {steps.map((s, i) => {
            const isCurrent = i === current;
            const isDone = answersByStep[i];
            const isReachable = i <= current;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => isReachable && onJump(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-all',
                    isCurrent
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : isReachable
                        ? 'text-foreground hover:bg-violet-50'
                        : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      isCurrent ? 'bg-white text-violet-700' : isDone ? 'bg-emerald-500 text-white' : 'bg-violet-100 text-violet-700'
                    )}
                  >
                    {isDone ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="flex-1 line-clamp-2">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OnboardingQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Initial load — pull any existing partial answers for this user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from('onboarding_answers')
        .select('answers, completed')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.answers && typeof data.answers === 'object') {
        setAnswers(data.answers as Answers);
      }
      setLoaded(true);
    })();
  }, []);

  const step = steps[currentStep];
  const question = step?.questions[currentQuestion];
  const questionText = useMemo(
    () => (question ? getQuestionText(question, answers) : ''),
    [question, answers],
  );

  // Derived denormalized fields used by the DB trigger to sync user_profile
  const denormalized = useMemo(() => {
    const basicInfo = answers.basic_info ?? {};
    const upInfo = answers.university_program_info ?? {};
    return {
      age_range: basicInfo.age_range ?? answers.age_range,
      gender: basicInfo.gender ?? answers.gender,
      degree_type: answers.degree_type,
      degree_interest: answers.degree_interest,
      inspiration: Array.isArray(answers.inspirational_figures?.choices)
        ? answers.inspirational_figures.choices.join(', ')
        : Array.isArray(answers.inspirational_figures)
          ? answers.inspirational_figures.join(', ')
          : undefined,
      personal_story: answers.challenge,
      university_name: upInfo.university,
      program: upInfo.program,
      background: answers.extracurricular_activities,
      career_goals: answers.long_term_goals,
      personal_strengths: Array.isArray(answers.qualities?.choices)
        ? answers.qualities.choices.join(', ')
        : Array.isArray(answers.qualities)
          ? answers.qualities.join(', ')
          : undefined,
    };
  }, [answers]);

  const totalQuestions = steps.reduce((acc, s) => acc + s.questions.length, 0);
  const currentOverall =
    steps.slice(0, currentStep).reduce((acc, s) => acc + s.questions.length, 0) + currentQuestion + 1;
  const progress = (currentOverall / totalQuestions) * 100;

  const answersByStep = steps.map((s) => s.questions.every((q) => answers[q.id] != null && answers[q.id] !== ''));

  const persist = async (extras: Record<string, any> = {}) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, any> = {
        answers,
        ...denormalized,
        ...extras,
      };
      if (user) {
        payload.user_id = user.id;
        const { error } = await supabase
          .from('onboarding_answers')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
      } else {
        // Anonymous fallback — should rarely fire since /onboarding is auth-gated
        const { error } = await supabase.from('onboarding_answers').insert(payload);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Could not save your progress.');
    } finally {
      setSaving(false);
    }
  };

  const updateAnswer = (next: any) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
  };

  const isAnswered = (q: Question, v: any): boolean => {
    if (q.optional) return true;
    if (v == null) return false;
    if (q.type === 'multiple') {
      const choices = Array.isArray(v?.choices) ? v.choices : Array.isArray(v) ? v : [];
      return choices.length > 0;
    }
    if (q.type === 'conditional') return !!v?.choice;
    if (q.type === 'combined_cards') {
      return q.subQuestions.every((sub) => isAnswered(sub as Question, (v as any)?.[sub.id]));
    }
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  };

  const goNext = async () => {
    if (!question) return;
    const v = answers[question.id];
    if (!isAnswered(question, v)) {
      toast.error('This question needs an answer before you continue.');
      return;
    }
    if (question.type === 'text' && question.validation) {
      const err = question.validation(v as string);
      if (err) {
        toast.error(err);
        return;
      }
    }
    await persist();
    if (currentQuestion < step.questions.length - 1) {
      setCurrentQuestion((x) => x + 1);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep((x) => x + 1);
      setCurrentQuestion(0);
    } else {
      setCompleting(true);
      await persist({ completed: true });
      setCompleting(false);
      toast.success('Onboarding complete — your profile has been updated.');
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((x) => x - 1);
    } else if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setCurrentQuestion(steps[prev].questions.length - 1);
    }
  };

  const jumpToStep = (i: number) => {
    if (i <= currentStep) {
      setCurrentStep(i);
      setCurrentQuestion(0);
    }
  };

  if (!loaded || !step || !question) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        </div>
      </MainLayout>
    );
  }

  const isLast = currentStep === steps.length - 1 && currentQuestion === step.questions.length - 1;

  return (
    <MainLayout>
      <div className="relative bg-mesh-violet">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-3xl animate-float" />
          <div className="absolute -top-12 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="mx-auto max-w-6xl space-y-6 px-2 pb-12">
          {/* Hero header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 p-6 sm:p-7 text-white shadow-lg">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">Get to know you</p>
                  <h1 className="text-2xl font-bold sm:text-3xl">Onboarding Journey</h1>
                  <p className="text-white/85 text-sm mt-0.5">Answer at your own pace — your profile updates automatically as you go.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/90">
                <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Step {currentStep + 1} / {steps.length}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{currentOverall} / {totalQuestions}</span>
              </div>
            </div>
            <Progress value={progress} className="mt-5 h-2 bg-white/20" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
            <StepsTOC current={currentStep} answersByStep={answersByStep} onJump={jumpToStep} />

            {/* Question card */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-violet-100 bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
                  <Star className="h-3.5 w-3.5" />
                  {step.title}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                <div className="mt-5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 ring-1 ring-violet-100">
                  <p className="text-base font-semibold text-foreground sm:text-lg">
                    {questionText}
                    {question.optional ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(Optional)</span>
                    ) : null}
                  </p>
                </div>

                <div className="mt-5">
                  <QuestionRenderer
                    question={question}
                    value={answers[question.id]}
                    onChange={updateAnswer}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white/80 p-3 shadow-sm backdrop-blur">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0 && currentQuestion === 0}
                  className="rounded-xl press-soft"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <p className="text-xs text-muted-foreground">
                  {saving ? 'Saving…' : 'Your answers save automatically.'}
                </p>
                <Button
                  onClick={goNext}
                  disabled={saving || completing}
                  className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all press-soft"
                >
                  {completing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  {isLast ? 'Finish' : 'Continue'}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
