import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  studentId: string;
  student: any;
  onComplete: () => void;
};

const STEPS = ['Welcome', 'About you', 'Academics', 'Interests', 'Family', 'Done'] as const;

export function JourneyOnboarding({ studentId, student, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Basics
  const [name, setName] = useState(student.name || '');
  const [preferredName, setPreferredName] = useState(student.preferred_name || '');
  const [email, setEmail] = useState(student.email || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [currentSchool, setCurrentSchool] = useState('');
  const [graduationYear, setGraduationYear] = useState(student.graduation_year || '');

  // Academics
  const [gpa, setGpa] = useState('');
  const [gpaScale, setGpaScale] = useState('4.0');
  const [sat, setSat] = useState('');
  const [act, setAct] = useState('');
  const [classRank, setClassRank] = useState('');

  // Interests
  const [majors, setMajors] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  // Family
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const finish = async () => {
    setSaving(true);
    try {
      const studentUpdate = await supabase
        .from('students')
        .update({
          name: name || student.name,
          preferred_name: preferredName || null,
          email: email || null,
          phone: phone || null,
          graduation_year: graduationYear || null,
        })
        .eq('id', studentId);
      if (studentUpdate.error) throw studentUpdate.error;

      const payload: any = {
        student_id: studentId,
        onboarded_at: new Date().toISOString(),
        current_school: currentSchool || null,
        graduation_year: graduationYear || null,
        gpa: gpa ? Number(gpa) : null,
        gpa_scale: gpaScale ? Number(gpaScale) : null,
        sat_score: sat ? Number(sat) : null,
        act_score: act ? Number(act) : null,
        class_rank: classRank || null,
        intended_majors: majors
          ? majors.split(',').map((m) => m.trim()).filter(Boolean)
          : [],
        career_goals: careerGoals || null,
        about_me: aboutMe || null,
        parent_name: parentName || null,
        parent_email: parentEmail || null,
        parent_phone: parentPhone || null,
      };

      const { data: existing } = await supabase
        .from('student_profile_extras')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      const write = existing
        ? await supabase.from('student_profile_extras').update(payload).eq('id', existing.id)
        : await supabase.from('student_profile_extras').insert(payload);
      if (write.error) throw write.error;

      toast.success('Welcome aboard!');
      onComplete();
    } catch (e: any) {
      console.error('Onboarding save failed:', e);
      toast.error(e?.message ? `Could not save: ${e.message}` : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-primary w-8' : 'bg-muted w-4'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {step === 0 && (
              <div className="text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Welcome to your journey</h1>
                <p className="text-muted-foreground">
                  In the next 2 minutes, we'll set up your profile so your counselor can give you the most personalized
                  guidance. You can always update this later.
                </p>
                <Button onClick={next} className="w-full sm:w-auto">
                  Let's start <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <Section title="About you" subtitle="Confirm your basics.">
                <Field label="Full name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Preferred name (optional)">
                  <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Email">
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="text" />
                  </Field>
                  <Field label="Phone">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Current school">
                    <Input value={currentSchool} onChange={(e) => setCurrentSchool(e.target.value)} />
                  </Field>
                  <Field label="Graduation year">
                    <Input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" />
                  </Field>
                </div>
              </Section>
            )}

            {step === 2 && (
              <Section title="Academics" subtitle="Numbers help us right-size your college list.">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="GPA">
                    <Input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="3.85" />
                  </Field>
                  <Field label="GPA scale">
                    <Input value={gpaScale} onChange={(e) => setGpaScale(e.target.value)} placeholder="4.0" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="SAT score">
                    <Input value={sat} onChange={(e) => setSat(e.target.value)} placeholder="1450" />
                  </Field>
                  <Field label="ACT score">
                    <Input value={act} onChange={(e) => setAct(e.target.value)} placeholder="32" />
                  </Field>
                </div>
                <Field label="Class rank (optional)">
                  <Input value={classRank} onChange={(e) => setClassRank(e.target.value)} placeholder="Top 10%" />
                </Field>
              </Section>
            )}

            {step === 3 && (
              <Section title="Interests & goals" subtitle="What pulls you forward?">
                <Field label="Intended majors (comma separated)">
                  <Input value={majors} onChange={(e) => setMajors(e.target.value)} placeholder="Computer Science, Economics" />
                </Field>
                <Field label="Career goals">
                  <Textarea value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} rows={3} />
                </Field>
                <Field label="About me — anything we should know">
                  <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={3} />
                </Field>
              </Section>
            )}

            {step === 4 && (
              <Section title="Family contact" subtitle="So we can loop in a parent when it matters.">
                <Field label="Parent / guardian name">
                  <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Parent email">
                    <Input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} type="text" />
                  </Field>
                  <Field label="Parent phone">
                    <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                  </Field>
                </div>
              </Section>
            )}

            {step === 5 && (
              <div className="text-center space-y-4 py-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">All set</h2>
                <p className="text-muted-foreground">
                  Your counselor will see your profile right away. You can edit anything from the Profile tab.
                </p>
                <Button onClick={finish} disabled={saving} className="min-w-40">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter portal'}
                </Button>
              </div>
            )}

            {step > 0 && step < 5 && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={back}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={next}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
