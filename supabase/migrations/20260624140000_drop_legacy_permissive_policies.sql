-- =============================================================================
-- Drop legacy "Allow public X" permissive policies
-- =============================================================================
-- The previous migration 20260624130000 added scoped policies but didn't
-- drop the old `"Allow public read/insert/update/delete on <table>"` policies
-- from much earlier migrations. Postgres OR's all policies for the same
-- command, so a permissive `USING (true)` defeats every scoped policy
-- next to it.
--
-- This sweeps every "Allow public ..." policy across the noga schema so the
-- scoped policies become the only ones in effect.
-- =============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'noga'
       AND policyname ILIKE 'Allow public %'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped %.% policy: %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- Verification: there should be no remaining "Allow public ..." policies
-- in the noga schema. Confirm with:
--   SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname = 'noga' AND policyname ILIKE 'Allow public %';
--   -- Expect 0 rows
