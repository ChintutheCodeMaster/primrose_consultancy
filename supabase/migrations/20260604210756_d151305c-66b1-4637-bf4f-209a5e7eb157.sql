
-- Extend students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'discovery',
  ADD COLUMN IF NOT EXISTS preferred_name TEXT;

-- Tokens
CREATE TABLE public.student_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_portal_tokens TO anon, authenticated;
GRANT ALL ON public.student_portal_tokens TO service_role;
ALTER TABLE public.student_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_portal_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_portal_tokens_updated BEFORE UPDATE ON public.student_portal_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks
CREATE TABLE public.student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'todo',
  link_url TEXT,
  created_by TEXT NOT NULL DEFAULT 'consultant',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_tasks TO anon, authenticated;
GRANT ALL ON public.student_tasks TO service_role;
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_student_tasks_updated BEFORE UPDATE ON public.student_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_messages TO anon, authenticated;
GRANT ALL ON public.student_messages TO service_role;
ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_messages FOR ALL USING (true) WITH CHECK (true);

-- Documents v2
CREATE TABLE public.student_documents_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'essay',
  prompt_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents_v2 TO anon, authenticated;
GRANT ALL ON public.student_documents_v2 TO service_role;
ALTER TABLE public.student_documents_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_documents_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_docs_v2_updated BEFORE UPDATE ON public.student_documents_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.student_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.student_documents_v2(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL DEFAULT 1,
  body_text TEXT,
  file_url TEXT,
  file_mime TEXT,
  word_count INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_document_versions TO anon, authenticated;
GRANT ALL ON public.student_document_versions TO service_role;
ALTER TABLE public.student_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_document_versions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.student_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.student_document_versions(id) ON DELETE CASCADE,
  anchor_start INTEGER,
  anchor_end INTEGER,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_document_comments TO anon, authenticated;
GRANT ALL ON public.student_document_comments TO service_role;
ALTER TABLE public.student_document_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_document_comments FOR ALL USING (true) WITH CHECK (true);

-- AI sessions
CREATE TABLE public.student_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  input_text TEXT,
  output_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_ai_sessions TO anon, authenticated;
GRANT ALL ON public.student_ai_sessions TO service_role;
ALTER TABLE public.student_ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.student_ai_sessions FOR ALL USING (true) WITH CHECK (true);
