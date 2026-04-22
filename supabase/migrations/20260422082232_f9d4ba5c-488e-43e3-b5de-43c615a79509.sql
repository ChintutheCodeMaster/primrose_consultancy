-- Create applied_universities table for tracking universities students applied to
CREATE TABLE public.applied_universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  degree_type TEXT,
  degree_type_other TEXT,
  field TEXT,
  study_year TEXT,
  application_status TEXT DEFAULT 'submitted',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.applied_universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on applied_universities"
ON public.applied_universities FOR SELECT USING (true);

CREATE POLICY "Allow public insert on applied_universities"
ON public.applied_universities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on applied_universities"
ON public.applied_universities FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on applied_universities"
ON public.applied_universities FOR DELETE USING (true);