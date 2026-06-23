-- =============================================================================
-- Restore RLS policies on tables nuked by the legacy-policy sweep
-- =============================================================================
-- Migration 20260624140000_drop_legacy_permissive_policies.sql swept every
-- "Allow public ..." policy across the noga schema. That was correct for the
-- 4 tables I rewrote with scoped policies (students, advisors, admins, leads)
-- but it also stripped permissive policies off ~20 other tables, leaving
-- them with RLS enabled and zero policies — which means deny-all.
--
-- This restores policies on those tables:
--   * Metadata tables (dropdowns, settings, templates) → permissive ALL
--     (they were always meant to be globally readable)
--   * Legacy student-data tables → scoped via student_id where the column
--     exists, otherwise permissive for now with a TODO
--   * Ambiguous tables (ai_*, projects, collaborations) → permissive for now,
--     to be revisited per-table when we know the column shapes
--
-- All scoped tables use the existing helpers from 20260624130000_rls_scoping.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper for student-scoped restore
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION noga._restore_student_scope(tbl text) RETURNS void
  LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = tbl
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'noga' AND table_name = tbl AND column_name = 'student_id'
  ) THEN
    EXECUTE format('CREATE POLICY %I ON noga.%I FOR ALL
             USING (student_id IN (SELECT noga.visible_student_ids()))
             WITH CHECK (student_id IN (SELECT noga.visible_student_ids()))',
      tbl || '_scope', tbl);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = tbl
  ) THEN
    -- Table exists but no student_id column — restore permissive for now.
    EXECUTE format('CREATE POLICY %I ON noga.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl || '_open', tbl);
  END IF;
END;
$$;

-- Helper for permissive read-only metadata tables (dropdowns, settings)
CREATE OR REPLACE FUNCTION noga._restore_permissive(tbl text) RETURNS void
  LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'noga' AND table_name = tbl
  ) THEN
    EXECUTE format('CREATE POLICY %I ON noga.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl || '_open', tbl);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Metadata tables — permissive (these are global dropdowns/settings)
-- ---------------------------------------------------------------------------
SELECT noga._restore_permissive('country_options');
SELECT noga._restore_permissive('field_options');
SELECT noga._restore_permissive('scholarship_options');
SELECT noga._restore_permissive('sidebar_categories');
SELECT noga._restore_permissive('source_options');
SELECT noga._restore_permissive('target_university_options');
SELECT noga._restore_permissive('agreement_templates');
SELECT noga._restore_permissive('leads_year_settings');

-- ---------------------------------------------------------------------------
-- 3. Legacy student-data tables — scope via student_id where possible
-- ---------------------------------------------------------------------------
SELECT noga._restore_student_scope('student_ai_sessions');
SELECT noga._restore_student_scope('student_calendar_events');
SELECT noga._restore_student_scope('student_checklist_items');
SELECT noga._restore_student_scope('student_conversations');
SELECT noga._restore_student_scope('student_documents');
SELECT noga._restore_student_scope('student_document_versions');
SELECT noga._restore_student_scope('student_document_comments');
SELECT noga._restore_student_scope('student_scholarships');

-- ---------------------------------------------------------------------------
-- 4. Ambiguous tables — permissive for now (TODO: tighten per-table)
-- ---------------------------------------------------------------------------
SELECT noga._restore_permissive('ai_conversations');
SELECT noga._restore_permissive('ai_messages');
SELECT noga._restore_permissive('collaborations');
SELECT noga._restore_permissive('projects');

-- ---------------------------------------------------------------------------
-- 5. Cleanup
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS noga._restore_student_scope(text);
DROP FUNCTION IF EXISTS noga._restore_permissive(text);

-- =============================================================================
-- Verification — run after applying:
--   SELECT c.relname, COUNT(p.policyname)
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
--   WHERE n.nspname = 'noga' AND c.relrowsecurity = true
--   GROUP BY c.relname HAVING COUNT(p.policyname) = 0;
--   -- Expect 0 rows. Every RLS-enabled table now has at least one policy.
-- =============================================================================
