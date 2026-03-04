
-- Add storage_bucket and storage_path columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS storage_path text DEFAULT NULL;

-- Migrate existing file_url data to storage_path
UPDATE public.projects
SET storage_bucket = 'project-files',
    storage_path = file_url
WHERE file_url IS NOT NULL AND file_url != '' AND storage_path IS NULL;
