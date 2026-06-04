import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Save } from "lucide-react";

interface Props {
  studentId: string;
}

type ProfileRow = {
  graduation_year: string | null;
  intended_majors: string[] | null;
  gpa: number | null;
  gpa_scale: number | null;
  sat_score: number | null;
  act_score: number | null;
  toefl_score: number | null;
  ielts_score: number | null;
  duolingo_score: number | null;
  extracurriculars: string | null;
  hooks: string | null;
  notes: string | null;
};

const emptyProfile: ProfileRow = {
  graduation_year: "",
  intended_majors: [],
  gpa: null,
  gpa_scale: 4.0,
  sat_score: null,
  act_score: null,
  toefl_score: null,
  ielts_score: null,
  duolingo_score: null,
  extracurriculars: "",
  hooks: "",
  notes: "",
};

export function StudentApplicantProfile({ studentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow>(emptyProfile);
  const [majorsText, setMajorsText] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("student_profile_extras")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setMajorsText((data.intended_majors || []).join(", "));
      } else {
        setProfile(emptyProfile);
        setMajorsText("");
      }
      setLoading(false);
    })();
  }, [studentId]);

  const update = <K extends keyof ProfileRow>(key: K, value: ProfileRow[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = async () => {
    setSaving(true);
    const payload = {
      student_id: studentId,
      graduation_year: profile.graduation_year || null,
      intended_majors: majorsText
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      gpa: profile.gpa,
      gpa_scale: profile.gpa_scale,
      sat_score: profile.sat_score,
      act_score: profile.act_score,
      toefl_score: profile.toefl_score,
      ielts_score: profile.ielts_score,
      duolingo_score: profile.duolingo_score,
      extracurriculars: profile.extracurriculars,
      hooks: profile.hooks,
      notes: profile.notes,
    };
    const { error } = await supabase
      .from("student_profile_extras")
      .upsert(payload, { onConflict: "student_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not save profile", variant: "destructive" });
    } else {
      toast({ title: "Applicant profile saved" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Applicant Profile
        </CardTitle>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Graduation Year</Label>
            <Input
              value={profile.graduation_year || ""}
              onChange={(e) => update("graduation_year", e.target.value)}
              placeholder="2026"
            />
          </div>
          <div>
            <Label>GPA</Label>
            <Input
              type="number"
              step="0.01"
              value={profile.gpa ?? ""}
              onChange={(e) => update("gpa", numOrNull(e.target.value))}
              placeholder="3.85"
            />
          </div>
          <div>
            <Label>GPA Scale</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.gpa_scale ?? ""}
              onChange={(e) => update("gpa_scale", numOrNull(e.target.value))}
              placeholder="4.0"
            />
          </div>
          <div>
            <Label>SAT</Label>
            <Input
              type="number"
              value={profile.sat_score ?? ""}
              onChange={(e) => update("sat_score", numOrNull(e.target.value))}
              placeholder="1500"
            />
          </div>
          <div>
            <Label>ACT</Label>
            <Input
              type="number"
              value={profile.act_score ?? ""}
              onChange={(e) => update("act_score", numOrNull(e.target.value))}
              placeholder="34"
            />
          </div>
          <div>
            <Label>TOEFL</Label>
            <Input
              type="number"
              value={profile.toefl_score ?? ""}
              onChange={(e) => update("toefl_score", numOrNull(e.target.value))}
              placeholder="110"
            />
          </div>
          <div>
            <Label>IELTS</Label>
            <Input
              type="number"
              step="0.5"
              value={profile.ielts_score ?? ""}
              onChange={(e) => update("ielts_score", numOrNull(e.target.value))}
              placeholder="7.5"
            />
          </div>
          <div>
            <Label>Duolingo</Label>
            <Input
              type="number"
              value={profile.duolingo_score ?? ""}
              onChange={(e) => update("duolingo_score", numOrNull(e.target.value))}
              placeholder="125"
            />
          </div>
        </div>

        <div>
          <Label>Intended Majors (comma-separated)</Label>
          <Input
            value={majorsText}
            onChange={(e) => setMajorsText(e.target.value)}
            placeholder="Computer Science, Economics"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Extracurriculars</Label>
            <Textarea
              rows={3}
              value={profile.extracurriculars || ""}
              onChange={(e) => update("extracurriculars", e.target.value)}
              placeholder="Activities, leadership roles, awards..."
            />
          </div>
          <div>
            <Label>Hooks</Label>
            <Textarea
              rows={3}
              value={profile.hooks || ""}
              onChange={(e) => update("hooks", e.target.value)}
              placeholder="Legacy, athlete, first-gen, recruited talent..."
            />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            rows={2}
            value={profile.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Strategy notes, family context, etc."
          />
        </div>
      </CardContent>
    </Card>
  );
}
