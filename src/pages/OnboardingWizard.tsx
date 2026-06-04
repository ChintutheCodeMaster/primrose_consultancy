import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Check, ArrowRight, ArrowLeft, GraduationCap, ListChecks, UserPlus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type College = {
  name: string;
  bucket: 'reach' | 'target' | 'likely' | 'safety';
  plan: 'ED' | 'EA' | 'RD' | 'Rolling' | '';
  deadline: string;
};

const STEPS = [
  { id: 1, title: 'Student', icon: UserPlus },
  { id: 2, title: 'Academic Profile', icon: GraduationCap },
  { id: 3, title: 'College List', icon: ListChecks },
  { id: 4, title: 'Finish', icon: Sparkles },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [student, setStudent] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Referral',
    meetingSummary: '',
  });

  // Step 2
  const [profile, setProfile] = useState({
    graduation_year: String(new Date().getFullYear() + 1),
    intended_majors: '',
    gpa: '',
    gpa_scale: '4.0',
    sat_score: '',
    act_score: '',
    toefl_score: '',
    extracurriculars: '',
    hooks: '',
  });

  // Step 3
  const [colleges, setColleges] = useState<College[]>([
    { name: '', bucket: 'reach', plan: '', deadline: '' },
    { name: '', bucket: 'target', plan: '', deadline: '' },
    { name: '', bucket: 'safety', plan: '', deadline: '' },
  ]);

  const addCollege = () =>
    setColleges([...colleges, { name: '', bucket: 'target', plan: '', deadline: '' }]);
  const removeCollege = (i: number) => setColleges(colleges.filter((_, idx) => idx !== i));
  const updateCollege = (i: number, patch: Partial<College>) =>
    setColleges(colleges.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const canNext = () => {
    if (step === 1) return student.name.trim().length > 0;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    try {
      // Insert student
      const { data: created, error: sErr } = await supabase
        .from('students')
        .insert({
          name: student.name.trim(),
          email: student.email || null,
          phone: student.phone || null,
          source: student.source,
          meeting_summary: student.meetingSummary || null,
          status: 'active',
          payment_type: 'package',
          package_cost: 0,
          amount_paid: 0,
          is_paid: false,
          signed_agreement: false,
        })
        .select('id')
        .single();
      if (sErr || !created) throw sErr || new Error('Failed to create student');

      const studentId = created.id;

      // Profile extras
      const profilePayload: any = {
        student_id: studentId,
        graduation_year: profile.graduation_year || null,
        intended_majors: profile.intended_majors
          ? profile.intended_majors.split(',').map((m) => m.trim()).filter(Boolean)
          : [],
        gpa: profile.gpa ? Number(profile.gpa) : null,
        gpa_scale: profile.gpa_scale ? Number(profile.gpa_scale) : null,
        sat_score: profile.sat_score ? Number(profile.sat_score) : null,
        act_score: profile.act_score ? Number(profile.act_score) : null,
        toefl_score: profile.toefl_score ? Number(profile.toefl_score) : null,
        extracurriculars: profile.extracurriculars || null,
        hooks: profile.hooks || null,
      };
      await supabase.from('student_profile_extras').insert(profilePayload);

      // Colleges
      const collegeRows = colleges
        .filter((c) => c.name.trim())
        .map((c, idx) => ({
          student_id: studentId,
          college_name: c.name.trim(),
          list_bucket: c.bucket,
          application_plan: c.plan || null,
          deadline: c.deadline || null,
          status: 'researching',
          sort_order: idx,
        }));
      if (collegeRows.length) {
        await supabase.from('student_colleges').insert(collegeRows);
      }

      toast.success('Student onboarded successfully!');
      navigate(`/student-portal/${studentId}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to onboard student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">New Student Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Walk through the four steps to set up a complete student profile.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done
                        ? 'bg-primary border-primary text-primary-foreground'
                        : active
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      active ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-6 ${done ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step - 1].title}</CardTitle>
            <CardDescription>
              {step === 1 && 'Basic contact information for the student.'}
              {step === 2 && 'Academic profile — used to inform college fit and recommendations.'}
              {step === 3 && 'Initial college list. You can refine this later in the portal.'}
              {step === 4 && 'Review and finalize. You can edit everything afterward.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full name *</Label>
                    <Input
                      value={student.name}
                      onChange={(e) => setStudent({ ...student, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={student.source}
                      onValueChange={(v) => setStudent({ ...student, source: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="School counselor">School counselor</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="text"
                      value={student.email}
                      onChange={(e) => setStudent({ ...student, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={student.phone}
                      onChange={(e) => setStudent({ ...student, phone: e.target.value })}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Intro meeting notes</Label>
                  <Textarea
                    rows={4}
                    value={student.meetingSummary}
                    onChange={(e) => setStudent({ ...student, meetingSummary: e.target.value })}
                    placeholder="Goals, family context, timeline, anything that matters..."
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Graduation year</Label>
                    <Input
                      value={profile.graduation_year}
                      onChange={(e) =>
                        setProfile({ ...profile, graduation_year: e.target.value })
                      }
                      placeholder="2027"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intended majors (comma-separated)</Label>
                    <Input
                      value={profile.intended_majors}
                      onChange={(e) =>
                        setProfile({ ...profile, intended_majors: e.target.value })
                      }
                      placeholder="Computer Science, Economics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input
                      value={profile.gpa}
                      onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
                      placeholder="3.9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA scale</Label>
                    <Input
                      value={profile.gpa_scale}
                      onChange={(e) => setProfile({ ...profile, gpa_scale: e.target.value })}
                      placeholder="4.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SAT</Label>
                    <Input
                      value={profile.sat_score}
                      onChange={(e) => setProfile({ ...profile, sat_score: e.target.value })}
                      placeholder="1480"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ACT</Label>
                    <Input
                      value={profile.act_score}
                      onChange={(e) => setProfile({ ...profile, act_score: e.target.value })}
                      placeholder="33"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TOEFL</Label>
                    <Input
                      value={profile.toefl_score}
                      onChange={(e) => setProfile({ ...profile, toefl_score: e.target.value })}
                      placeholder="105"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Extracurriculars</Label>
                  <Textarea
                    rows={3}
                    value={profile.extracurriculars}
                    onChange={(e) =>
                      setProfile({ ...profile, extracurriculars: e.target.value })
                    }
                    placeholder="Robotics club president, varsity soccer, volunteer tutor..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hooks</Label>
                  <Input
                    value={profile.hooks}
                    onChange={(e) => setProfile({ ...profile, hooks: e.target.value })}
                    placeholder="Legacy, first-generation, recruited athlete..."
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {colleges.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="col-span-12 sm:col-span-4 space-y-1">
                      <Label className="text-xs">College</Label>
                      <Input
                        value={c.name}
                        onChange={(e) => updateCollege(i, { name: e.target.value })}
                        placeholder="Stanford University"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Bucket</Label>
                      <Select
                        value={c.bucket}
                        onValueChange={(v: any) => updateCollege(i, { bucket: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reach">Reach</SelectItem>
                          <SelectItem value="target">Target</SelectItem>
                          <SelectItem value="likely">Likely</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Plan</Label>
                      <Select
                        value={c.plan || 'none'}
                        onValueChange={(v) =>
                          updateCollege(i, { plan: v === 'none' ? '' : (v as any) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="ED">ED</SelectItem>
                          <SelectItem value="EA">EA</SelectItem>
                          <SelectItem value="RD">RD</SelectItem>
                          <SelectItem value="Rolling">Rolling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Deadline</Label>
                      <Input
                        type="date"
                        value={c.deadline}
                        onChange={(e) => updateCollege(i, { deadline: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCollege(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCollege} className="gap-2">
                  <Plus className="h-4 w-4" /> Add college
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Student</h3>
                  <p className="text-sm text-muted-foreground">
                    {student.name || '—'} · {student.email || 'no email'} ·{' '}
                    {student.phone || 'no phone'}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Academics</h3>
                  <p className="text-sm text-muted-foreground">
                    Class of {profile.graduation_year || '—'} · GPA{' '}
                    {profile.gpa || '—'}/{profile.gpa_scale} · SAT{' '}
                    {profile.sat_score || '—'} · ACT {profile.act_score || '—'}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">
                    College list ({colleges.filter((c) => c.name.trim()).length})
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {colleges
                      .filter((c) => c.name.trim())
                      .map((c, i) => (
                        <li key={i}>
                          • {c.name} <span className="capitalize">({c.bucket})</span>
                          {c.plan && ` · ${c.plan}`}
                          {c.deadline && ` · due ${c.deadline}`}
                        </li>
                      ))}
                    {colleges.filter((c) => c.name.trim()).length === 0 && (
                      <li>No colleges added yet — you can add them later.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex justify-between pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1 || saving}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={finish} disabled={saving} className="gap-2">
                  {saving ? 'Saving...' : 'Create student'}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
