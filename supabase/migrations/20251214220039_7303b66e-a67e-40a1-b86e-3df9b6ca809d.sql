-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  degree_type TEXT NOT NULL DEFAULT 'bachelor',
  interested_country TEXT,
  interested_field TEXT,
  meeting_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_contact_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  degree_type TEXT NOT NULL DEFAULT 'bachelor',
  interested_country TEXT,
  interested_field TEXT,
  source TEXT,
  meeting_summary TEXT,
  package_cost NUMERIC DEFAULT 0,
  advisor_name TEXT,
  is_paid BOOLEAN DEFAULT false,
  target_country TEXT,
  target_university TEXT,
  program TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  graduation_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accepted universities table for students
CREATE TABLE public.accepted_universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  acceptance_letter_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for acceptance letters
INSERT INTO storage.buckets (id, name, public) VALUES ('acceptance-letters', 'acceptance-letters', true);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_universities ENABLE ROW LEVEL SECURITY;

-- Create policies for leads - public access for now (no auth yet)
CREATE POLICY "Allow public read on leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on leads" ON public.leads FOR DELETE USING (true);

-- Create policies for students - public access for now
CREATE POLICY "Allow public read on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on students" ON public.students FOR DELETE USING (true);

-- Create policies for accepted_universities - public access for now
CREATE POLICY "Allow public read on accepted_universities" ON public.accepted_universities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on accepted_universities" ON public.accepted_universities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on accepted_universities" ON public.accepted_universities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on accepted_universities" ON public.accepted_universities FOR DELETE USING (true);

-- Storage policies for acceptance letters
CREATE POLICY "Allow public read on acceptance-letters" ON storage.objects FOR SELECT USING (bucket_id = 'acceptance-letters');
CREATE POLICY "Allow public upload on acceptance-letters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'acceptance-letters');
CREATE POLICY "Allow public delete on acceptance-letters" ON storage.objects FOR DELETE USING (bucket_id = 'acceptance-letters');