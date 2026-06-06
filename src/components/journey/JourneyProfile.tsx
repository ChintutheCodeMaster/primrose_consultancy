import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function JourneyProfile({ studentId, student }: { studentId: string; student: any }) {
  const [extras, setExtras] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('student_profile_extras')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();
    setExtras(data || {});
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const startEdit = (section: string) => {
    setForm(extras || {});
    setEditing(section);
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async () => {
    setSaving(true);
    const payload: any = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (typeof payload.intended_majors === 'string') {
      payload.intended_majors = payload.intended_majors.split(',').map((m: string) => m.trim()).filter(Boolean);
    }
    payload.gpa = payload.gpa ? Number(payload.gpa) : null;
    payload.sat_score = payload.sat_score ? Number(payload.sat_score) : null;
    payload.act_score = payload.act_score ? Number(payload.act_score) : null;

    if (extras?.id) {
      await supabase.from('student_profile_extras').update(payload).eq('id', extras.id);
    } else {
      await supabase.from('student_profile_extras').insert({ ...payload, student_id: studentId });
    }
    setSaving(false);
    setEditing(null);
    await load();
    toast.success('Profile updated');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Keep this current — your counselor sees it instantly.
        </p>
      </div>

      <SectionCard
        title="Basics"
        editing={editing === 'basics'}
        onEdit={() => startEdit('basics')}
        onCancel={cancel}
        onSave={save}
        saving={saving}
      >
        {editing === 'basics' ? (
          <>
            <Field label="Current school">
              <Input value={form.current_school || ''} onChange={(e) => setForm({ ...form, current_school: e.target.value })} />
            </Field>
            <Field label="Graduation year">
              <Input value={form.graduation_year || ''} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </Field>
          </>
        ) : (
          <>
            <Row label="Name" value={student.name} />
            <Row label="Preferred name" value={student.preferred_name} />
            <Row label="Email" value={student.email} />
            <Row label="Phone" value={student.phone} />
            <Row label="Current school" value={extras?.current_school} />
            <Row label="Graduation year" value={extras?.graduation_year} />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Academics"
        editing={editing === 'academics'}
        onEdit={() => startEdit('academics')}
        onCancel={cancel}
        onSave={save}
        saving={saving}
      >
        {editing === 'academics' ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="GPA">
                <Input value={form.gpa ?? ''} onChange={(e) => setForm({ ...form, gpa: e.target.value })} />
              </Field>
              <Field label="GPA scale">
                <Input value={form.gpa_scale ?? ''} onChange={(e) => setForm({ ...form, gpa_scale: e.target.value })} />
              </Field>
              <Field label="SAT">
                <Input value={form.sat_score ?? ''} onChange={(e) => setForm({ ...form, sat_score: e.target.value })} />
              </Field>
              <Field label="ACT">
                <Input value={form.act_score ?? ''} onChange={(e) => setForm({ ...form, act_score: e.target.value })} />
              </Field>
            </div>
            <Field label="Class rank">
              <Input value={form.class_rank || ''} onChange={(e) => setForm({ ...form, class_rank: e.target.value })} />
            </Field>
          </>
        ) : (
          <>
            <Row label="GPA" value={extras?.gpa ? `${extras.gpa}${extras.gpa_scale ? ` / ${extras.gpa_scale}` : ''}` : null} />
            <Row label="SAT" value={extras?.sat_score} />
            <Row label="ACT" value={extras?.act_score} />
            <Row label="Class rank" value={extras?.class_rank} />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Interests & goals"
        editing={editing === 'interests'}
        onEdit={() => startEdit('interests')}
        onCancel={cancel}
        onSave={save}
        saving={saving}
      >
        {editing === 'interests' ? (
          <>
            <Field label="Intended majors (comma separated)">
              <Input
                value={Array.isArray(form.intended_majors) ? form.intended_majors.join(', ') : form.intended_majors || ''}
                onChange={(e) => setForm({ ...form, intended_majors: e.target.value })}
              />
            </Field>
            <Field label="Career goals">
              <Textarea value={form.career_goals || ''} onChange={(e) => setForm({ ...form, career_goals: e.target.value })} rows={3} />
            </Field>
            <Field label="About me">
              <Textarea value={form.about_me || ''} onChange={(e) => setForm({ ...form, about_me: e.target.value })} rows={3} />
            </Field>
          </>
        ) : (
          <>
            <Row label="Intended majors" value={(extras?.intended_majors || []).join(', ')} />
            <Row label="Career goals" value={extras?.career_goals} />
            <Row label="About me" value={extras?.about_me} />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Family"
        editing={editing === 'family'}
        onEdit={() => startEdit('family')}
        onCancel={cancel}
        onSave={save}
        saving={saving}
      >
        {editing === 'family' ? (
          <>
            <Field label="Parent / guardian name">
              <Input value={form.parent_name || ''} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Parent email">
                <Input value={form.parent_email || ''} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} type="text" />
              </Field>
              <Field label="Parent phone">
                <Input value={form.parent_phone || ''} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
              </Field>
            </div>
          </>
        ) : (
          <>
            <Row label="Parent name" value={extras?.parent_name} />
            <Row label="Parent email" value={extras?.parent_email} />
            <Row label="Parent phone" value={extras?.parent_phone} />
          </>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {editing ? (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1" /> Save</>}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 whitespace-pre-wrap">{value || <span className="text-muted-foreground/50">—</span>}</div>
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
