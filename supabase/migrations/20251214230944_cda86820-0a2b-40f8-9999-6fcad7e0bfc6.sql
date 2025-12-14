
-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for agreement form templates
CREATE TABLE public.agreement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;

-- Allow public access (internal use)
CREATE POLICY "Allow public read on agreement_templates"
ON public.agreement_templates
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on agreement_templates"
ON public.agreement_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on agreement_templates"
ON public.agreement_templates
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on agreement_templates"
ON public.agreement_templates
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_agreement_templates_updated_at
BEFORE UPDATE ON public.agreement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
