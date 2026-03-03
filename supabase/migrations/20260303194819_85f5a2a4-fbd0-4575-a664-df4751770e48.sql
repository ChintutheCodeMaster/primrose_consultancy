
-- Create collaborations (parent entity - e.g. "ישראליז")
CREATE TABLE public.collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  contact_phone text,
  contact_email text,
  category text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on collaborations" ON public.collaborations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collaborations" ON public.collaborations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collaborations" ON public.collaborations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on collaborations" ON public.collaborations FOR DELETE USING (true);

-- Add collaboration_id FK and payment_notes to projects
ALTER TABLE public.projects
  ADD COLUMN collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE CASCADE,
  ADD COLUMN payment_notes text;

-- Move contact fields from projects to collaborations (keep in projects too for backward compat but make optional)
