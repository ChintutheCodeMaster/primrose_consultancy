-- Add did_not_continue column to leads table
ALTER TABLE public.leads 
ADD COLUMN did_not_continue boolean DEFAULT false;

-- Add did_not_continue column to students table
ALTER TABLE public.students 
ADD COLUMN did_not_continue boolean DEFAULT false;