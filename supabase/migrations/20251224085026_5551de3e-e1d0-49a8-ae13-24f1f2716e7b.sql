-- Add column to track actual amount paid
ALTER TABLE public.students 
ADD COLUMN amount_paid numeric DEFAULT 0;