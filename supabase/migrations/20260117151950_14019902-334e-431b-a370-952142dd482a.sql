-- Add notification_dismissed field to track which agreement notifications have been dismissed
ALTER TABLE public.student_agreements 
ADD COLUMN notification_dismissed boolean DEFAULT false;