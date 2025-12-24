-- Add column to track if student is dismissed from dashboard attention
ALTER TABLE public.students 
ADD COLUMN dismissed_from_attention boolean DEFAULT false;