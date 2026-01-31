-- Add portal_password column to advisors table
ALTER TABLE public.advisors ADD COLUMN portal_password text DEFAULT NULL;