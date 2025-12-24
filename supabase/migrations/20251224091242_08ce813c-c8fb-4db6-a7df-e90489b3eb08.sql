-- Add type column to agreement_templates
ALTER TABLE public.agreement_templates 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'package';

-- Insert the 3 agreement types if they don't exist
INSERT INTO public.agreement_templates (name, content, type, is_active)
SELECT 'הסכם חבילה', 'תוכן הסכם חבילה - לערוך לפי הצורך', 'package', true
WHERE NOT EXISTS (SELECT 1 FROM public.agreement_templates WHERE type = 'package');

INSERT INTO public.agreement_templates (name, content, type, is_active)
SELECT 'הסכם שעתי', 'תוכן הסכם שעתי - לערוך לפי הצורך', 'hourly', true
WHERE NOT EXISTS (SELECT 1 FROM public.agreement_templates WHERE type = 'hourly');

INSERT INTO public.agreement_templates (name, content, type, is_active)
SELECT 'הסכם לערוך', 'תוכן הסכם לערוך - לערוך לפי הצורך', 'edit', true
WHERE NOT EXISTS (SELECT 1 FROM public.agreement_templates WHERE type = 'edit');