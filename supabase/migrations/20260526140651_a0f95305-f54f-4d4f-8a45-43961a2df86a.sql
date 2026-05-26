ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS follow_up_reminder_date date,
ADD COLUMN IF NOT EXISTS follow_up_reminder_note text,
ADD COLUMN IF NOT EXISTS follow_up_reminder_dismissed boolean DEFAULT false;