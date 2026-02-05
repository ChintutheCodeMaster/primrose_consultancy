-- Create country_options table for managing country options in dropdowns
CREATE TABLE public.country_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.country_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (same pattern as other tables in this project)
CREATE POLICY "Allow public read on country_options" 
ON public.country_options 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on country_options" 
ON public.country_options 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on country_options" 
ON public.country_options 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on country_options" 
ON public.country_options 
FOR DELETE 
USING (true);

-- Insert default country options
INSERT INTO public.country_options (name, is_active, sort_order) VALUES
  ('אנגליה', true, 1),
  ('ארה״ב', true, 2),
  ('קנדה', true, 3),
  ('הולנד', true, 4),
  ('גרמניה', true, 5),
  ('אוסטרליה', true, 6);