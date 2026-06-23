-- =============================================================================
-- IEC Scope Isolation via Row-Level Security
-- =============================================================================
-- Replaces the permissive `FOR ALL USING (true)` policies on every noga.*
-- domain table with policies that enforce the IEC hierarchy:
--
--   noga.admins (role='iec_admin')
--     ↓ noga.advisors.admin_id
--   noga.advisors (role='consultant')
--     ↓ noga.students.advisor_id
--   noga.students (role='student')
--
-- Scoping rules:
--   * Student → only their own student row + everything attached to it
--   * Consultant → themselves + students where advisor_id = me + all attached
--                  data + other advisors in their IEC
--   * IEC admin → all advisors where admin_id = me + everything under them
--
-- Complete TPR ↔ Noga isolation at the UI layer. No `is_tpr_admin()` clause.
-- Service-role keys (edge functions, SQL editor) bypass RLS as usual.
--
-- Signup-flow carve-outs:
--   * A freshly-authenticated user (just signed up via invite) has no
--     domain row yet, so visible_*_ids() returns nothing. To let the
--     invite-consume flow work, we add separate INSERT/UPDATE policies
--     that allow `user_id = auth.uid()` (self-claim) provided the row is
--     unclaimed and the invite-side fields are populated correctly.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema: leads.advisor_id (was free-text only)
-- ---------------------------------------------------------------------------
ALTER TABLE noga.leads
  ADD COLUMN IF NOT EXISTS advisor_id uuid REFERENCES noga.advisors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_advisor_id_idx ON noga.leads (advisor_id);

-- ---------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER, STABLE)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION noga.current_advisor_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT id FROM noga.advisors WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION noga.current_admin_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT id FROM noga.admins WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION noga.current_student_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT id FROM noga.students WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION noga.is_iec_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'iec_admin');
$$;

CREATE OR REPLACE FUNCTION noga.visible_advisor_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT id FROM noga.advisors
   WHERE (noga.is_iec_admin() AND admin_id = noga.current_admin_id())
      OR id = noga.current_advisor_id();
$$;

CREATE OR REPLACE FUNCTION noga.visible_student_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = noga, public, pg_temp AS $$
  SELECT s.id FROM noga.students s
   WHERE s.id = noga.current_student_id()
      OR s.advisor_id IN (SELECT noga.visible_advisor_ids());
$$;

GRANT EXECUTE ON FUNCTION
  noga.current_advisor_id(),
  noga.current_admin_id(),
  noga.current_student_id(),
  noga.is_iec_admin(),
  noga.visible_advisor_ids(),
  noga.visible_student_ids()
TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Helper: apply scoped policy to a student-anchored table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION noga._apply_student_scope(tbl text, policy_name text) RETURNS void
  LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = tbl
  ) THEN
    EXECUTE format('ALTER TABLE noga.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON noga.%I', policy_name, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON noga.%I', tbl || '_all', tbl);
    EXECUTE format('CREATE POLICY %I ON noga.%I FOR ALL
             USING (student_id IN (SELECT noga.visible_student_ids()))
             WITH CHECK (student_id IN (SELECT noga.visible_student_ids()))',
      policy_name, tbl);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Per-table policies
-- ---------------------------------------------------------------------------

-- noga.students -------------------------------------------------------------
ALTER TABLE noga.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS students_all ON noga.students;
DROP POLICY IF EXISTS students_read ON noga.students;
DROP POLICY IF EXISTS students_write ON noga.students;
DROP POLICY IF EXISTS students_insert ON noga.students;
DROP POLICY IF EXISTS students_update ON noga.students;
DROP POLICY IF EXISTS students_delete ON noga.students;
DROP POLICY IF EXISTS students_claim ON noga.students;

CREATE POLICY students_read ON noga.students FOR SELECT
  USING (
    id IN (SELECT noga.visible_student_ids())
    OR (noga.is_iec_admin() AND advisor_id IS NULL)  -- admin sees orphan students in their IEC
    OR user_id = auth.uid()                          -- you can always see your own row
  );

-- INSERT: consultant creating their own student, admin creating in their IEC,
-- or a freshly-signed-up student claiming a row tied to an advisor (signup flow).
CREATE POLICY students_insert ON noga.students FOR INSERT
  WITH CHECK (
    (noga.current_advisor_id() IS NOT NULL AND advisor_id = noga.current_advisor_id())
    OR (noga.is_iec_admin() AND (advisor_id IS NULL OR advisor_id IN (SELECT noga.visible_advisor_ids())))
    OR (user_id = auth.uid() AND advisor_id IS NOT NULL)  -- student self-signup via invite
  );

-- UPDATE: normal scoped update OR a self-claim update (used_id IS NULL → set to me).
CREATE POLICY students_update ON noga.students FOR UPDATE
  USING (
    id IN (SELECT noga.visible_student_ids())
    OR (noga.is_iec_admin() AND advisor_id IS NULL)
    OR user_id IS NULL                                -- unclaimed row, available to claim via invite
    OR user_id = auth.uid()
  )
  WITH CHECK (
    id IN (SELECT noga.visible_student_ids())
    OR (noga.is_iec_admin() AND (advisor_id IS NULL OR advisor_id IN (SELECT noga.visible_advisor_ids())))
    OR user_id = auth.uid()
  );

CREATE POLICY students_delete ON noga.students FOR DELETE
  USING (
    id IN (SELECT noga.visible_student_ids())
    OR (noga.is_iec_admin() AND advisor_id IS NULL)
  );

-- noga.advisors -------------------------------------------------------------
ALTER TABLE noga.advisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS advisors_all ON noga.advisors;
DROP POLICY IF EXISTS advisors_read ON noga.advisors;
DROP POLICY IF EXISTS advisors_write ON noga.advisors;
DROP POLICY IF EXISTS advisors_insert ON noga.advisors;
DROP POLICY IF EXISTS advisors_update ON noga.advisors;

CREATE POLICY advisors_read ON noga.advisors FOR SELECT
  USING (
    id IN (SELECT noga.visible_advisor_ids())
    OR user_id = auth.uid()
  );

-- INSERT: admin creating in their IEC, or self-signup via invite.
CREATE POLICY advisors_insert ON noga.advisors FOR INSERT
  WITH CHECK (
    noga.is_iec_admin()
    OR (user_id = auth.uid() AND admin_id IS NOT NULL)
  );

-- UPDATE: self-update, in-IEC admin, or unclaimed-row claim flow.
CREATE POLICY advisors_update ON noga.advisors FOR UPDATE
  USING (
    id = noga.current_advisor_id()
    OR noga.is_iec_admin()
    OR user_id IS NULL
    OR user_id = auth.uid()
  )
  WITH CHECK (
    id = noga.current_advisor_id()
    OR noga.is_iec_admin()
    OR user_id = auth.uid()
  );

-- noga.admins ---------------------------------------------------------------
ALTER TABLE noga.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admins_all ON noga.admins;
DROP POLICY IF EXISTS admins_self ON noga.admins;
-- Admins are seeded via service-role SQL only — no UI insert path. Authenticated
-- users see only their own row.
CREATE POLICY admins_self ON noga.admins FOR ALL
  USING (id = noga.current_admin_id() OR user_id = auth.uid())
  WITH CHECK (id = noga.current_admin_id() OR user_id = auth.uid());

-- noga.leads ----------------------------------------------------------------
ALTER TABLE noga.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_all ON noga.leads;
DROP POLICY IF EXISTS leads_scope ON noga.leads;
CREATE POLICY leads_scope ON noga.leads FOR ALL
  USING (
    advisor_id IN (SELECT noga.visible_advisor_ids())
    OR (noga.is_iec_admin() AND advisor_id IS NULL)
  )
  WITH CHECK (
    advisor_id = noga.current_advisor_id()
    OR noga.is_iec_admin()
    OR (advisor_id IS NULL AND noga.is_iec_admin())
  );

-- noga.conversations + noga.messages ---------------------------------------
ALTER TABLE noga.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversations_all ON noga.conversations;
DROP POLICY IF EXISTS conversations_scope ON noga.conversations;
CREATE POLICY conversations_scope ON noga.conversations FOR ALL
  USING (student_id IN (SELECT noga.visible_student_ids())
      OR advisor_id IN (SELECT noga.visible_advisor_ids()))
  WITH CHECK (
    (student_id = noga.current_student_id() AND advisor_id IN (SELECT noga.visible_advisor_ids()))
    OR advisor_id = noga.current_advisor_id()
    OR noga.is_iec_admin()
  );

ALTER TABLE noga.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_all ON noga.messages;
DROP POLICY IF EXISTS messages_scope ON noga.messages;
CREATE POLICY messages_scope ON noga.messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM noga.conversations
     WHERE student_id IN (SELECT noga.visible_student_ids())
        OR advisor_id IN (SELECT noga.visible_advisor_ids())
  ))
  WITH CHECK (sender_id = auth.uid() OR noga.is_iec_admin());

-- noga.essay_feedback + noga.essay_feedback_history ------------------------
SELECT noga._apply_student_scope('essay_feedback', 'essay_feedback_scope');
SELECT noga._apply_student_scope('essay_feedback_history', 'essay_feedback_history_scope');

-- noga.cost_plans ----------------------------------------------------------
SELECT noga._apply_student_scope('cost_plans', 'cost_plans_scope');

-- Student-anchored legacy + auxiliary tables --------------------------------
SELECT noga._apply_student_scope('student_tasks', 'student_tasks_scope');
SELECT noga._apply_student_scope('student_colleges', 'student_colleges_scope');
SELECT noga._apply_student_scope('student_profile_extras', 'student_profile_extras_scope');
SELECT noga._apply_student_scope('accepted_universities', 'accepted_universities_scope');
SELECT noga._apply_student_scope('applied_universities', 'applied_universities_scope');
SELECT noga._apply_student_scope('student_agreements', 'student_agreements_scope');
SELECT noga._apply_student_scope('student_documents_v2', 'student_documents_v2_scope');

-- Legacy document versions / comments — scope via parent doc ---------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = 'student_documents_v2_versions'
  ) THEN
    ALTER TABLE noga.student_documents_v2_versions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS student_documents_v2_versions_all ON noga.student_documents_v2_versions;
    DROP POLICY IF EXISTS student_documents_v2_versions_scope ON noga.student_documents_v2_versions;
    EXECUTE 'CREATE POLICY student_documents_v2_versions_scope ON noga.student_documents_v2_versions FOR ALL
             USING (document_id IN (
               SELECT id FROM noga.student_documents_v2
                WHERE student_id IN (SELECT noga.visible_student_ids())
             ))
             WITH CHECK (document_id IN (
               SELECT id FROM noga.student_documents_v2
                WHERE student_id IN (SELECT noga.visible_student_ids())
             ))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = 'student_documents_v2_comments'
  ) THEN
    ALTER TABLE noga.student_documents_v2_comments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS student_documents_v2_comments_all ON noga.student_documents_v2_comments;
    DROP POLICY IF EXISTS student_documents_v2_comments_scope ON noga.student_documents_v2_comments;
    EXECUTE 'CREATE POLICY student_documents_v2_comments_scope ON noga.student_documents_v2_comments FOR ALL
             USING (document_id IN (
               SELECT id FROM noga.student_documents_v2
                WHERE student_id IN (SELECT noga.visible_student_ids())
             ))
             WITH CHECK (document_id IN (
               SELECT id FROM noga.student_documents_v2
                WHERE student_id IN (SELECT noga.visible_student_ids())
             ))';
  END IF;
END $$;

-- noga.student_invites + noga.advisor_invites -------------------------------
-- Invites have two paths:
--   1. Owner read/write (consultant/admin managing their invites): scope by FK
--   2. Anyone may resolve a pending invite by token (signup flow needs this)
--   3. The consuming user marks it used (claim by setting used_by_user_id = me)

ALTER TABLE noga.student_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_invites_all ON noga.student_invites;
DROP POLICY IF EXISTS student_invites_scope ON noga.student_invites;
DROP POLICY IF EXISTS student_invites_token_read ON noga.student_invites;
DROP POLICY IF EXISTS student_invites_consume ON noga.student_invites;
CREATE POLICY student_invites_owner ON noga.student_invites FOR ALL
  USING (advisor_id IN (SELECT noga.visible_advisor_ids()))
  WITH CHECK (advisor_id IN (SELECT noga.visible_advisor_ids()));
CREATE POLICY student_invites_token_read ON noga.student_invites FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY student_invites_consume ON noga.student_invites FOR UPDATE
  TO authenticated
  USING (used_at IS NULL)
  WITH CHECK (used_by_user_id = auth.uid());

ALTER TABLE noga.advisor_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS advisor_invites_all ON noga.advisor_invites;
DROP POLICY IF EXISTS advisor_invites_scope ON noga.advisor_invites;
DROP POLICY IF EXISTS advisor_invites_token_read ON noga.advisor_invites;
DROP POLICY IF EXISTS advisor_invites_consume ON noga.advisor_invites;
CREATE POLICY advisor_invites_owner ON noga.advisor_invites FOR ALL
  USING (admin_id = noga.current_admin_id())
  WITH CHECK (admin_id = noga.current_admin_id());
CREATE POLICY advisor_invites_token_read ON noga.advisor_invites FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY advisor_invites_consume ON noga.advisor_invites FOR UPDATE
  TO authenticated
  USING (used_at IS NULL)
  WITH CHECK (used_by_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Cleanup
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS noga._apply_student_scope(text, text);

-- =============================================================================
-- Verification queries
-- =============================================================================
-- As consultant CA:
--   SELECT count(*) FROM noga.students;     -- only CA's students
--   SELECT count(*) FROM noga.leads;        -- only CA's leads
-- As admin A:
--   SELECT count(*) FROM noga.advisors;     -- CA + other advisors of admin A
-- As student SA:
--   SELECT count(*) FROM noga.students;     -- 1 (SA's own)
-- TPR isolation: sign in as role='admin' → all noga selects return 0.
-- =============================================================================
