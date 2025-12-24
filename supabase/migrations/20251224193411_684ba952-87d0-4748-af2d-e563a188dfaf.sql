-- Add country field to accepted_universities table
ALTER TABLE public.accepted_universities 
ADD COLUMN country TEXT;