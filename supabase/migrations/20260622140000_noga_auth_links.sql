-- =====================================================================
-- Noga Phase 2 — Link Supabase Auth into noga.*
--
-- After the shared public.user_roles + public.handle_new_user trigger is
-- in place (see 20260622130000_add_consultant_role.sql for the enum), we
-- need to bridge auth.users into Noga's two human-bearing tables:
--   - noga.advisors  (consultants in the UI)
--   - noga.students
-- Plus a new noga.student_invites table so consultants can generate
-- per-student registration links (replacement for the old
-- student_portal_tokens flow).
--
-- Decisions baked in here:
--   * user_id is nullable — existing rows (real advisors and students
--     already in the DB) keep working until the human logs in for the
--     first time, at which point the frontend backfills by email match.
--   * user_id is UNIQUE — one auth.users row maps to at most one advisor
--     row and at most one student row. (A future "consultant who is also
--     a student" edge case would need its own design.)
--   * ON DELETE SET NULL on the auth.users FK — deleting an auth user
--     does NOT cascade-delete Noga domain data. The Noga row stays as a
--     historical record with user_id = NULL.
--   * RLS on noga.student_invites is permissive to match the rest of
--     noga.* today. Tightening noga.* RLS is a Phase 3 problem.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. noga.advisors — add user_id link to auth.users
-- ---------------------------------------------------------------------
ALTER TABLE noga.advisors
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS advisors_user_id_unique
  ON noga.advisors (user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. noga.students — add user_id link to auth.users
-- ---------------------------------------------------------------------
ALTER TABLE noga.students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_unique
  ON noga.students (user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. noga.student_invites — consultant-generated registration links
--
-- Flow:
--   * Consultant clicks "Generate registration link" → row inserted
--     with advisor_id = the consultant's noga.advisors.id.
--   * Optionally pre-attached to an existing noga.students row via
--     student_id (when the consultant manually created the student
--     first and now wants to invite them).
--   * Optionally pre-filled email/name so the registration form is
--     less work for the student.
--   * Student visits /register?invite=<token> → frontend resolves the
--     row, runs supabase.auth.signUp with role='student', then in a
--     client-side follow-up either UPDATEs the linked noga.students row
--     (setting user_id) or INSERTs a new one with advisor_id from the
--     invite, and marks the invite consumed (used_at + used_by_user_id).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.student_invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token             text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  advisor_id        uuid NOT NULL REFERENCES noga.advisors(id) ON DELETE CASCADE,
  student_id        uuid REFERENCES noga.students(id) ON DELETE CASCADE,
  email             text,
  name              text,
  expires_at        timestamptz,
  used_at           timestamptz,
  used_by_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_invites_advisor_id_idx
  ON noga.student_invites (advisor_id);

CREATE INDEX IF NOT EXISTS student_invites_unused_idx
  ON noga.student_invites (token)
  WHERE used_at IS NULL;

-- RLS — permissive to match rest of noga.* (Phase 3 will tighten everything together)
ALTER TABLE noga.student_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_invites_all ON noga.student_invites;
CREATE POLICY student_invites_all
  ON noga.student_invites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================================
-- Verification
--
-- 1. New columns present:
--      SELECT column_name FROM information_schema.columns
--      WHERE table_schema='noga' AND table_name='advisors' AND column_name='user_id';
--      SELECT column_name FROM information_schema.columns
--      WHERE table_schema='noga' AND table_name='students' AND column_name='user_id';
--
-- 2. Invites table:
--      \d noga.student_invites
--
-- 3. Token generator works:
--      INSERT INTO noga.student_invites (advisor_id) VALUES (<some advisor id>);
--      SELECT token FROM noga.student_invites ORDER BY created_at DESC LIMIT 1;
-- =====================================================================
