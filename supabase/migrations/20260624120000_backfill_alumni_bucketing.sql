-- =============================================================================
-- Backfill: align student bucketing with status enum, not graduation_year
-- =============================================================================
-- Until this commit, /students and /past-clients bucketed students by
-- graduation_year IS NULL / NOT NULL. That misuses graduation_year (which
-- should be "Class of YYYY" metadata) as a lifecycle marker. A student with
-- a future graduation year (e.g. 2027) was being shown under Alumni even
-- though they haven't started their final year.
--
-- The new bucketing uses students.status as the canonical signal:
--   * Active     = status != 'graduated' AND did_not_continue = false
--   * Alumni     = status  = 'graduated' AND graduation_year = :year
--   * Closed/Lost = did_not_continue = true
--
-- This migration brings existing rows into a consistent state with the new
-- rules. Safe to run multiple times.
-- =============================================================================

-- 1. Anyone with a non-NULL graduation_year but a non-'graduated' status was
--    being mis-bucketed as Alumni. Treat their graduation_year as planning
--    metadata only — they stay Active until explicitly graduated via the UI.
--    No data is destroyed; the year stays in graduation_year for reference.
UPDATE noga.students
SET status = 'active'
WHERE status IS NULL
   OR status = '';

-- 2. (Defensive) anyone explicitly 'graduated' but with a NULL graduation_year
--    has no archive year to live under. Keep them as alumni but flag the gap
--    by leaving graduation_year NULL — the Alumni page won't match them on
--    any year-specific URL, which is the right behavior until you fill it in.
--    No-op UPDATE; documented here for awareness, no row mutation needed.

-- 3. Backfill specific known-bad row from session investigation (Gretta):
--    she was created with graduation_year='2027' but status='active'. The
--    new query treats her correctly already (active stays active), but we
--    null out her graduation_year so it doesn't confuse future code reading
--    graduation_year as factual.
--    Comment in / out as needed; idempotent.
--
-- UPDATE noga.students
-- SET graduation_year = NULL
-- WHERE id = '1077e422-fc55-468f-b4e1-be468e9e7261'
--   AND status = 'active';

-- =============================================================================
-- Verification
-- =============================================================================
-- After applying:
--
--   -- Active students (should match /students)
--   SELECT COUNT(*) FROM noga.students
--   WHERE status != 'graduated' AND did_not_continue = false;
--
--   -- Alumni by year (should match /past-clients/:year)
--   SELECT graduation_year, COUNT(*) FROM noga.students
--   WHERE status = 'graduated' AND did_not_continue = false
--   GROUP BY graduation_year ORDER BY graduation_year DESC;
--
--   -- Anyone with a future graduation_year is NOW correctly Active:
--   SELECT id, name, status, graduation_year FROM noga.students
--   WHERE graduation_year IS NOT NULL
--     AND graduation_year::int > extract(year FROM now())::int;
-- =============================================================================
