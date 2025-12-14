-- Create advisors table
CREATE TABLE public.advisors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (same pattern as other tables)
CREATE POLICY "Allow public read on advisors" 
ON public.advisors 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on advisors" 
ON public.advisors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on advisors" 
ON public.advisors 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on advisors" 
ON public.advisors 
FOR DELETE 
USING (true);

-- Update students table to reference advisors
ALTER TABLE public.students 
ADD COLUMN advisor_id UUID REFERENCES public.advisors(id);