-- =============================================================================
-- Port TPR's essay-feedback system into Noga
-- =============================================================================
-- Creates noga.essay_feedback + noga.essay_feedback_history. Mirrors TPR's
-- public.essay_feedback shape (with all subsequent ALTERs baked in) but remaps
-- FKs from auth.users(id) to noga.students(id) / noga.advisors(id).
--
-- Also wipes the existing kind='essay' rows from noga.student_documents_v2
-- (user authorised — those rows are moving to the new dedicated tables).
--
-- Includes a defensive create-if-missing for public.api_usage_log (the shared
-- rate-limiter writes to it; the table already exists in the shared TPR/Noga
-- Supabase project but the block keeps the migration idempotent on fresh DBs).
-- =============================================================================

-- ── 1. Wipe stale essay rows from the multi-type document tables ─────────────
DELETE FROM noga.student_document_comments
  WHERE version_id IN (
    SELECT v.id FROM noga.student_document_versions v
    JOIN noga.student_documents_v2 d ON d.id = v.document_id
    WHERE d.kind = 'essay'
  );
DELETE FROM noga.student_document_versions
  WHERE document_id IN (SELECT id FROM noga.student_documents_v2 WHERE kind = 'essay');
DELETE FROM noga.student_documents_v2 WHERE kind = 'essay';

-- ── 2. essay_feedback ────────────────────────────────────────────────────────
CREATE TABLE noga.essay_feedback (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES noga.students(id) ON DELETE CASCADE,
  counselor_id      uuid REFERENCES noga.advisors(id) ON DELETE SET NULL,
  essay_title       text NOT NULL,
  essay_content     text NOT NULL,
  essay_prompt      text,
  target_school     text,
  word_limit        integer,
  ai_analysis       jsonb,
  feedback_items    jsonb DEFAULT '[]'::jsonb,

  track_changes     jsonb DEFAULT '[]'::jsonb,
  manual_notes      text,
  personal_message  text,
  status            text NOT NULL DEFAULT 'draft',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz
);

CREATE INDEX idx_essay_feedback_student_id   ON noga.essay_feedback (student_id);
CREATE INDEX idx_essay_feedback_counselor_id ON noga.essay_feedback (counselor_id);
CREATE INDEX idx_essay_feedback_status       ON noga.essay_feedback (status);

CREATE TRIGGER update_essay_feedback_updated_at
  BEFORE UPDATE ON noga.essay_feedback
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

ALTER TABLE noga.essay_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on essay_feedback"
  ON noga.essay_feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert on essay_feedback"
  ON noga.essay_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on essay_feedback"
  ON noga.essay_feedback FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on essay_feedback"
  ON noga.essay_feedback FOR DELETE USING (true);

-- ── 3. essay_feedback_history ───────────────────────────────────────────────
CREATE TABLE noga.essay_feedback_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id          uuid NOT NULL REFERENCES noga.essay_feedback(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES noga.students(id) ON DELETE CASCADE,
  counselor_id      uuid REFERENCES noga.advisors(id) ON DELETE SET NULL,
  version           integer NOT NULL DEFAULT 1,
  feedback_items    jsonb,
  manual_notes      text,
  personal_message  text,
  ai_analysis       jsonb,
  track_changes     jsonb DEFAULT '[]'::jsonb,
  essay_content     text,
  status            text NOT NULL DEFAULT 'draft',
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_essay_feedback_history_essay_id   ON noga.essay_feedback_history (essay_id);
CREATE INDEX idx_essay_feedback_history_student_id ON noga.essay_feedback_history (student_id);

ALTER TABLE noga.essay_feedback_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on essay_feedback_history"
  ON noga.essay_feedback_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on essay_feedback_history"
  ON noga.essay_feedback_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on essay_feedback_history"
  ON noga.essay_feedback_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on essay_feedback_history"
  ON noga.essay_feedback_history FOR DELETE USING (true);

-- ── 4. Defensive: ensure public.api_usage_log exists (rate-limiter writes here)
DO $$
BEGIN
  IF to_regclass('public.api_usage_log') IS NULL THEN
    CREATE TABLE public.api_usage_log (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       uuid NOT NULL,
      function_name text NOT NULL,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_api_usage_log_user_function_time
      ON public.api_usage_log (user_id, function_name, created_at DESC);
    ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service role full access"
      ON public.api_usage_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
