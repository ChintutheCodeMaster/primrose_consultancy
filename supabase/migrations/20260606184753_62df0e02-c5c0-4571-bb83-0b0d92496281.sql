
-- Profile extras: onboarding + parent + counselor notes
ALTER TABLE public.student_profile_extras
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS counselor_notes text,
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS activities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS career_goals text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS current_school text,
  ADD COLUMN IF NOT EXISTS class_rank text;

-- Per-college progress
ALTER TABLE public.student_colleges
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS essays_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS recs_status text DEFAULT 'not_started';

-- Docs upgrade
ALTER TABLE public.student_documents_v2
  ADD COLUMN IF NOT EXISTS folder text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS requested_by text,
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS uploaded_by text;

-- Messages upgrade
ALTER TABLE public.student_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS cc_parent boolean DEFAULT false;

-- Tasks upgrade
ALTER TABLE public.student_tasks
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.student_colleges(id) ON DELETE SET NULL;

-- Realtime: only add when not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='student_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.student_messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='student_documents_v2') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.student_documents_v2';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='student_tasks') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tasks';
  END IF;
END $$;

ALTER TABLE public.student_messages REPLICA IDENTITY FULL;
ALTER TABLE public.student_documents_v2 REPLICA IDENTITY FULL;
ALTER TABLE public.student_tasks REPLICA IDENTITY FULL;
