-- Add payment_type column to students table
ALTER TABLE public.students 
ADD COLUMN payment_type text DEFAULT 'package';