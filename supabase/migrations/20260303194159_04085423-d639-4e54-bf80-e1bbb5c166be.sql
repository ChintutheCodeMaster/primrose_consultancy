
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  payment_direction text NOT NULL DEFAULT 'income',
  amount numeric DEFAULT 0,
  payment_date date,
  invoice_date date,
  status text NOT NULL DEFAULT 'active',
  contact_name text,
  contact_phone text,
  contact_email text,
  category text,
  file_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert on projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on projects" ON public.projects FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

CREATE POLICY "Allow public read on project-files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Allow public insert on project-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Allow public delete on project-files" ON storage.objects FOR DELETE USING (bucket_id = 'project-files');
