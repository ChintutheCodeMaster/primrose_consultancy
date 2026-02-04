-- Add payment_date column to track when payment was marked as paid
ALTER TABLE public.students 
ADD COLUMN payment_date DATE NULL;