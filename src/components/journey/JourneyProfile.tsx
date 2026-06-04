import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function JourneyProfile({ studentId, student }: { studentId: string; student: any }) {
  const [extras, setExtras] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('student_profile_extras')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()
      .then(({ data }) => setExtras(data));
  }, [studentId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          What we know about you. Need a change? Send a message to your consultant.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <Row label="Name" value={student.name} />
          <Row label="Preferred name" value={student.preferred_name} />
          <Row label="Email" value={student.email} />
          <Row label="Phone" value={student.phone} />
        </CardContent>
      </Card>

      {extras && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <Row label="Graduation year" value={extras.graduation_year} />
            <Row label="Intended majors" value={(extras.intended_majors || []).join(', ')} />
            <Row label="GPA" value={extras.gpa ? `${extras.gpa} / ${extras.gpa_scale || ''}` : null} />
            <Row label="SAT" value={extras.sat_score} />
            <Row label="ACT" value={extras.act_score} />
            <Row label="TOEFL" value={extras.toefl_score} />
            <Row label="Extracurriculars" value={extras.extracurriculars} />
            <Row label="Hooks" value={extras.hooks} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 whitespace-pre-wrap">{value}</div>
    </div>
  );
}
