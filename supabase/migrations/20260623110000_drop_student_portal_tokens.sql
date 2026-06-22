-- =====================================================================
-- Drop the legacy student-portal token system (Phase E of the Option-A
-- auth cutover).
--
-- After this migration:
--   * `/journey/:token` route is gone (removed in Phase D).
--   * All consultant UI for generating/copying/revoking tokens is gone.
--   * Auth'd students access their workspace via /students/:id/workspace
--     after registering through /register?invite={token}.
--
-- CASCADE drops any dependent FKs/policies/triggers automatically.
-- Both schemas (noga + public) had a copy; nuke both.
-- =====================================================================

DROP TABLE IF EXISTS noga.student_portal_tokens CASCADE;
DROP TABLE IF EXISTS public.student_portal_tokens CASCADE;
