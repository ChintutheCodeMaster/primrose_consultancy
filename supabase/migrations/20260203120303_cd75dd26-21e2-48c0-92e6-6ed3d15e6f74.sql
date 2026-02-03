-- Add leads_year column to leads table
ALTER TABLE public.leads ADD COLUMN leads_year TEXT;

-- Update existing leads based on their created_at date
UPDATE public.leads 
SET leads_year = CASE
  WHEN created_at >= '2022-09-01' AND created_at < '2023-09-01' THEN '23'
  WHEN created_at >= '2023-09-01' AND created_at < '2024-09-01' THEN '24'
  WHEN created_at >= '2024-09-01' AND created_at < '2025-09-01' THEN '25'
  WHEN created_at >= '2025-09-01' AND created_at < '2026-09-01' THEN '26'
  WHEN created_at >= '2026-09-01' AND created_at < '2027-09-01' THEN '27'
  ELSE '27'
END;