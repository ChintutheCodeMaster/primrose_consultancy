-- Add payment reminder date column to students table
ALTER TABLE public.students 
ADD COLUMN payment_reminder_date DATE NULL;