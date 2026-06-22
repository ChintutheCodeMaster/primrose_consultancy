-- =====================================================================
-- Invite system polish (Phase B of the Option-A auth cutover).
--
-- Two changes:
--   1. Give `noga.student_invites.expires_at` a 30-day default so invites
--      no longer live forever silently when the app forgets to set one.
--   2. Add a partial unique index so at most ONE unused invite can exist
--      per student. Consultants who click "Copy Invite Link" twice on the
--      same un-claimed student will hit a 23505 the second time; the app
--      catches that and shows the existing invite in Manage Portal.
--
-- Safe to re-run: cleanup is keyed on `id` so it's idempotent; ALTER
-- COLUMN SET DEFAULT and CREATE UNIQUE INDEX IF NOT EXISTS are both
-- naturally idempotent.
-- =====================================================================

-- 1) De-duplicate existing unused invites BEFORE adding the unique index.
--    Keeps only the newest unused invite per student; older ones are
--    marked used so they can't be redeemed (instead of deleting history).
UPDATE noga.student_invites
SET used_at = now()
WHERE used_at IS NULL
  AND student_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (student_id) id
    FROM noga.student_invites
    WHERE used_at IS NULL AND student_id IS NOT NULL
    ORDER BY student_id, created_at DESC
  );

-- 2) Default expires_at to 30 days from creation.
ALTER TABLE noga.student_invites
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- 3) At most one unused invite per student.
CREATE UNIQUE INDEX IF NOT EXISTS student_invites_one_unused_per_student
  ON noga.student_invites (student_id)
  WHERE used_at IS NULL AND student_id IS NOT NULL;
