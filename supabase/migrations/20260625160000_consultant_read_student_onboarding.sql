-- =====================================================================
-- Let consultants (and IEC admins) READ their assigned students'
-- onboarding answers, profile, target colleges, and voice insights.
--
-- The 4 tables created in 20260625140000 keyed everything on auth.users.id
-- with "owner only" RLS — so even a consultant who owned the noga.students
-- row for that user couldn't see anything they filled out.
--
-- We layer ADD-ONLY SELECT policies that resolve up through noga.students
-- to noga.visible_advisor_ids() (defined in 20260624130000). The existing
-- owner-only policies stay; this just widens read access for assigned
-- consultants and the IEC admin who owns them. No new write access.
-- =====================================================================

-- ---------------------------------------------------------------------
-- noga.user_profiles
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS user_profiles_consultant_read ON noga.user_profiles;
CREATE POLICY user_profiles_consultant_read
  ON noga.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM noga.students s
      WHERE s.user_id = noga.user_profiles.user_id
        AND s.advisor_id IN (SELECT noga.visible_advisor_ids())
    )
  );

-- ---------------------------------------------------------------------
-- noga.onboarding_answers
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS onboarding_answers_consultant_read ON noga.onboarding_answers;
CREATE POLICY onboarding_answers_consultant_read
  ON noga.onboarding_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM noga.students s
      WHERE s.user_id = noga.onboarding_answers.user_id
        AND s.advisor_id IN (SELECT noga.visible_advisor_ids())
    )
  );

-- ---------------------------------------------------------------------
-- noga.user_target_colleges
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS user_target_colleges_consultant_read ON noga.user_target_colleges;
CREATE POLICY user_target_colleges_consultant_read
  ON noga.user_target_colleges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM noga.students s
      WHERE s.user_id = noga.user_target_colleges.user_id
        AND s.advisor_id IN (SELECT noga.visible_advisor_ids())
    )
  );

-- ---------------------------------------------------------------------
-- noga.voice_insights
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS voice_insights_consultant_read ON noga.voice_insights;
CREATE POLICY voice_insights_consultant_read
  ON noga.voice_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM noga.students s
      WHERE s.user_id = noga.voice_insights.user_id
        AND s.advisor_id IN (SELECT noga.visible_advisor_ids())
    )
  );
