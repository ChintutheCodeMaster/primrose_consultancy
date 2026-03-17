
-- Scholarship options dropdown table
CREATE TABLE public.scholarship_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarship_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on scholarship_options" ON public.scholarship_options FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on scholarship_options" ON public.scholarship_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on scholarship_options" ON public.scholarship_options FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on scholarship_options" ON public.scholarship_options FOR DELETE TO public USING (true);

-- Seed initial scholarship options
INSERT INTO public.scholarship_options (name, sort_order) VALUES
('צ''בנינג', 1),
('פולברייט', 2),
('פישמן', 3),
('רודס', 4),
('ILF', 5);

-- Student scholarships table
CREATE TABLE public.student_scholarships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on student_scholarships" ON public.student_scholarships FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on student_scholarships" ON public.student_scholarships FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on student_scholarships" ON public.student_scholarships FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on student_scholarships" ON public.student_scholarships FOR DELETE TO public USING (true);
