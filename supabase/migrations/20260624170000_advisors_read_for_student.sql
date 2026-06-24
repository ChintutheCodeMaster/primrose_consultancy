-- =====================================================================
-- Allow a student to read their assigned consultant (advisors row).
--
-- The advisors_read policy from 20260624130000 only grants SELECT to
-- IEC admins (visible_advisor_ids) and the advisor themselves. Students
-- got blocked, which broke StudentMessages.tsx and JourneyMessages.tsx
-- — both fell back to the literal "Your consultant" string instead of
-- showing the real name.
--
-- This extends advisors_read with one extra clause: the caller can
-- read the advisor row referenced by their own noga.students.advisor_id.
-- Existing access for admins / self is unchanged.
-- =====================================================================

DROP POLICY IF EXISTS advisors_read ON noga.advisors;

CREATE POLICY advisors_read ON noga.advisors FOR SELECT
  USING (
    id IN (SELECT noga.visible_advisor_ids())
    OR user_id = auth.uid()
    OR id IN (
      SELECT s.advisor_id
      FROM noga.students s
      WHERE s.user_id = auth.uid()
        AND s.advisor_id IS NOT NULL
    )
  );
