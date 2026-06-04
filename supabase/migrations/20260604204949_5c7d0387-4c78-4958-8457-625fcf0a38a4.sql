
-- =========================================================
-- student_colleges: one row per (student, college on the list)
-- =========================================================
CREATE TABLE public.student_colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  country TEXT,
  list_bucket TEXT NOT NULL DEFAULT 'target',
    -- expected: reach | target | safety | likely
  application_plan TEXT,
    -- expected: ED | ED2 | EA | REA | RD | Rolling
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'researching',
    -- expected: researching | planned | in_progress | submitted
    --         | admitted | denied | waitlisted | deferred | withdrawn
  submitted_at DATE,
  decision_at DATE,
  portal_url TEXT,
  application_id TEXT,
  scholarship_amount NUMERIC,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX student_colleges_student_id_idx ON public.student_colleges(student_id);
CREATE INDEX student_colleges_deadline_idx ON public.student_colleges(deadline);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_colleges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_colleges TO authenticated;
GRANT ALL ON public.student_colleges TO service_role;

ALTER TABLE public.student_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on student_colleges"   ON public.student_colleges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_colleges" ON public.student_colleges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_colleges" ON public.student_colleges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_colleges" ON public.student_colleges FOR DELETE USING (true);

CREATE TRIGGER update_student_colleges_updated_at
BEFORE UPDATE ON public.student_colleges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- student_profile_extras: US-application profile per student
-- =========================================================
CREATE TABLE public.student_profile_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  graduation_year TEXT,
  intended_majors TEXT[] NOT NULL DEFAULT '{}',
  gpa NUMERIC,
  gpa_scale NUMERIC DEFAULT 4.0,
  sat_score INT,
  act_score INT,
  toefl_score INT,
  ielts_score NUMERIC,
  duolingo_score INT,
  extracurriculars TEXT,
  hooks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profile_extras TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profile_extras TO authenticated;
GRANT ALL ON public.student_profile_extras TO service_role;

ALTER TABLE public.student_profile_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on student_profile_extras"   ON public.student_profile_extras FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_profile_extras" ON public.student_profile_extras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_profile_extras" ON public.student_profile_extras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_profile_extras" ON public.student_profile_extras FOR DELETE USING (true);

CREATE TRIGGER update_student_profile_extras_updated_at
BEFORE UPDATE ON public.student_profile_extras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
