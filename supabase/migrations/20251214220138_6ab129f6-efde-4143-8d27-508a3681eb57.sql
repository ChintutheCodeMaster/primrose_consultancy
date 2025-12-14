-- Add signed_agreement field to students table
ALTER TABLE public.students ADD COLUMN signed_agreement BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN agreement_reminder_date TIMESTAMP WITH TIME ZONE;