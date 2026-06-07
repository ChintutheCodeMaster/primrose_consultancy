
-- 1. activity_events: unified feed surface
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'system', -- consultant | student | system
  kind text NOT NULL,                   -- message | essay_version | essay_status | comment | college | task | acceptance | file | calendar
  ref_table text,
  ref_id uuid,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_events_student_created_idx ON public.activity_events (student_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated, anon;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access activity_events" ON public.activity_events FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;

-- 2. student_workspace_notes: shared notepad
CREATE TABLE public.student_workspace_notes (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_workspace_notes TO authenticated, anon;
GRANT ALL ON public.student_workspace_notes TO service_role;
ALTER TABLE public.student_workspace_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access workspace_notes" ON public.student_workspace_notes FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_workspace_notes;

-- 3. workspace_presence_state: last-seen tracking
CREATE TABLE public.workspace_presence_state (
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  side text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, side)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_presence_state TO authenticated, anon;
GRANT ALL ON public.workspace_presence_state TO service_role;
ALTER TABLE public.workspace_presence_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access presence" ON public.workspace_presence_state FOR ALL USING (true) WITH CHECK (true);

-- 4. consultant read receipt on messages
ALTER TABLE public.student_messages ADD COLUMN IF NOT EXISTS consultant_read_at timestamptz;

-- 5. Activity emission triggers

-- messages
CREATE OR REPLACE FUNCTION public.emit_activity_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    NEW.student_id,
    COALESCE(NEW.author, 'system'),
    'message',
    'student_messages',
    NEW.id,
    LEFT(NEW.body, 140),
    jsonb_build_object('hasAttachment', NEW.attachment_url IS NOT NULL)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_message ON public.student_messages;
CREATE TRIGGER trg_activity_message AFTER INSERT ON public.student_messages
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_message();

-- essay version
CREATE OR REPLACE FUNCTION public.emit_activity_essay_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE doc record;
BEGIN
  SELECT student_id, title INTO doc FROM public.student_documents_v2 WHERE id = NEW.document_id;
  IF doc.student_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    doc.student_id,
    COALESCE(NEW.created_by, 'system'),
    'essay_version',
    'student_document_versions',
    NEW.id,
    'New version of "' || COALESCE(doc.title, 'document') || '"',
    jsonb_build_object('documentId', NEW.document_id, 'title', doc.title)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_essay_version ON public.student_document_versions;
CREATE TRIGGER trg_activity_essay_version AFTER INSERT ON public.student_document_versions
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_essay_version();

-- essay comment
CREATE OR REPLACE FUNCTION public.emit_activity_essay_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; ttitle text;
BEGIN
  SELECT d.student_id, d.title INTO sid, ttitle
  FROM public.student_document_versions v
  JOIN public.student_documents_v2 d ON d.id = v.document_id
  WHERE v.id = NEW.version_id;
  IF sid IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    sid,
    COALESCE(NEW.author, 'system'),
    'comment',
    'student_document_comments',
    NEW.id,
    'Comment on "' || COALESCE(ttitle, 'document') || '": ' || LEFT(NEW.body, 100),
    jsonb_build_object('versionId', NEW.version_id, 'title', ttitle)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_essay_comment ON public.student_document_comments;
CREATE TRIGGER trg_activity_essay_comment AFTER INSERT ON public.student_document_comments
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_essay_comment();

-- college additions
CREATE OR REPLACE FUNCTION public.emit_activity_college()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    NEW.student_id, 'system', 'college', 'student_colleges', NEW.id,
    'Added ' || COALESCE(NEW.college_name, 'a college') || ' to college list',
    jsonb_build_object('collegeName', NEW.college_name)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_college ON public.student_colleges;
CREATE TRIGGER trg_activity_college AFTER INSERT ON public.student_colleges
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_college();

-- tasks
CREATE OR REPLACE FUNCTION public.emit_activity_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
    VALUES (NEW.student_id, 'system', 'task', 'student_tasks', NEW.id,
      'New task: ' || COALESCE(NEW.title, 'Untitled'),
      jsonb_build_object('completed', false));
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.completed, false) = false AND COALESCE(NEW.completed, false) = true THEN
    INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
    VALUES (NEW.student_id, 'system', 'task', 'student_tasks', NEW.id,
      'Completed task: ' || COALESCE(NEW.title, 'Untitled'),
      jsonb_build_object('completed', true));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_task ON public.student_tasks;
CREATE TRIGGER trg_activity_task AFTER INSERT OR UPDATE ON public.student_tasks
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_task();

-- acceptances
CREATE OR REPLACE FUNCTION public.emit_activity_acceptance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (NEW.student_id, 'system', 'acceptance', 'accepted_universities', NEW.id,
    'Acceptance: ' || COALESCE(NEW.name, 'University'),
    jsonb_build_object('university', NEW.name));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_acceptance ON public.accepted_universities;
CREATE TRIGGER trg_activity_acceptance AFTER INSERT ON public.accepted_universities
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_acceptance();

-- calendar events
CREATE OR REPLACE FUNCTION public.emit_activity_calendar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (NEW.student_id, 'system', 'calendar', 'student_calendar_events', NEW.id,
    COALESCE(NEW.title, 'Event') || ' scheduled',
    jsonb_build_object('title', NEW.title, 'startsAt', NEW.starts_at));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_activity_calendar ON public.student_calendar_events;
CREATE TRIGGER trg_activity_calendar AFTER INSERT ON public.student_calendar_events
FOR EACH ROW EXECUTE FUNCTION public.emit_activity_calendar();

-- workspace notes updated_at
CREATE OR REPLACE FUNCTION public.touch_workspace_notes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_touch_workspace_notes ON public.student_workspace_notes;
CREATE TRIGGER trg_touch_workspace_notes BEFORE UPDATE ON public.student_workspace_notes
FOR EACH ROW EXECUTE FUNCTION public.touch_workspace_notes();
