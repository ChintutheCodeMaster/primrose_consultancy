-- Create source_options table for managing lead/student sources
CREATE TABLE public.source_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.source_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (same pattern as other tables in this project)
CREATE POLICY "Allow public read on source_options" 
ON public.source_options 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on source_options" 
ON public.source_options 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on source_options" 
ON public.source_options 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on source_options" 
ON public.source_options 
FOR DELETE 
USING (true);

-- Insert default source options
INSERT INTO public.source_options (name, is_active, sort_order) VALUES
  ('לינקדאין', true, 1),
  ('פייסבוק', true, 2),
  ('גוגל', true, 3),
  ('פודקאסט', true, 4),
  ('המלצה ממועמד עבר', true, 5),
  ('קהילת לימודים באנגליה', true, 6),
  ('אינסטגרם', true, 7);