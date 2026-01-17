-- Allow null/empty email in students table
ALTER TABLE public.students ALTER COLUMN email DROP NOT NULL;