-- Create field_options table for dynamic field of study management
CREATE TABLE public.field_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.field_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on field_options" ON public.field_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert on field_options" ON public.field_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on field_options" ON public.field_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on field_options" ON public.field_options FOR DELETE USING (true);

-- Seed with the existing default fields
INSERT INTO public.field_options (name, sort_order) VALUES
  ('LLM', 1),
  ('MBA', 2),
  ('INTERNATIONAL RELATIONS', 3),
  ('NEUROSCIENCE', 4),
  ('BACHELORS GENERAL', 5),
  ('MASTERS GENERAL', 6),
  ('REAL ESTATE', 7),
  ('ARTS', 8),
  ('FINANCE', 9),
  ('COMPUTER SCIENCE', 10),
  ('PSYCHOLOGY', 11),
  ('ARCHITECTURE', 12),
  ('PHD / DOCTORAL PROGRAMS', 13),
  ('אחר', 99)
ON CONFLICT (name) DO NOTHING;