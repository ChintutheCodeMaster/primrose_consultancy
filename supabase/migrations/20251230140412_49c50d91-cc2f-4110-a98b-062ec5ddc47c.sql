-- Add package_notes column to leads table
ALTER TABLE public.leads 
ADD COLUMN package_notes text DEFAULT NULL;

-- Add package_notes column to students table
ALTER TABLE public.students 
ADD COLUMN package_notes text DEFAULT NULL;