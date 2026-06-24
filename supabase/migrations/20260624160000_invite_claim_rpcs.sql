-- =====================================================================
-- Invite claim RPCs
--
-- Background: noga.students / noga.advisors RLS (20260624130000) requires
-- the caller to already be the row's owner (user_id = auth.uid()) or an
-- IEC admin. A freshly-signed-up user is neither — the very write that
-- WOULD make them the owner is blocked by RLS. The frontend was doing
-- this update directly from the client (Register.tsx), so it silently
-- 0-rowed and left students/advisors with user_id = NULL, leading to
-- "Your workspace isn't set up yet" on StudentHome.
--
-- These RPCs run SECURITY DEFINER, validate the invite token + auth.uid()
-- server-side, do the linkage + mark the invite consumed atomically,
-- and return the linked row id.
--
-- Noga-only: bodies touch only noga.* tables. TPR signups are unaffected.
-- =====================================================================

-- ---------------------------------------------------------------------
-- noga.claim_student_invite
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION noga.claim_student_invite(
  p_token     text,
  p_full_name text,
  p_email     text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_invite     noga.student_invites;
  v_student_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_invite
  FROM noga.student_invites
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent re-claim by the same user (e.g. user retried after a flake)
  IF v_invite.used_at IS NOT NULL THEN
    IF v_invite.used_by_user_id = v_uid AND v_invite.student_id IS NOT NULL THEN
      RETURN v_invite.student_id;
    END IF;
    RAISE EXCEPTION 'invite already used' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'invite expired' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.student_id IS NOT NULL THEN
    UPDATE noga.students
    SET user_id = v_uid,
        email   = COALESCE(NULLIF(p_email, ''), email),
        name    = COALESCE(NULLIF(p_full_name, ''), name)
    WHERE id = v_invite.student_id
    RETURNING id INTO v_student_id;
  ELSE
    INSERT INTO noga.students (name, email, user_id, advisor_id, status)
    VALUES (p_full_name, p_email, v_uid, v_invite.advisor_id, 'active')
    RETURNING id INTO v_student_id;
  END IF;

  UPDATE noga.student_invites
  SET used_at         = now(),
      used_by_user_id = v_uid,
      student_id      = COALESCE(student_id, v_student_id)
  WHERE id = v_invite.id;

  RETURN v_student_id;
END;
$$;

REVOKE ALL ON FUNCTION noga.claim_student_invite(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION noga.claim_student_invite(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- noga.claim_advisor_invite
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION noga.claim_advisor_invite(
  p_token     text,
  p_full_name text,
  p_email     text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_invite     noga.advisor_invites;
  v_advisor_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_invite
  FROM noga.advisor_invites
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    IF v_invite.used_by_user_id = v_uid AND v_invite.advisor_id IS NOT NULL THEN
      RETURN v_invite.advisor_id;
    END IF;
    RAISE EXCEPTION 'invite already used' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'invite expired' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.advisor_id IS NOT NULL THEN
    UPDATE noga.advisors
    SET user_id  = v_uid,
        admin_id = v_invite.admin_id,
        email    = COALESCE(NULLIF(p_email, ''), email),
        name     = COALESCE(NULLIF(p_full_name, ''), name)
    WHERE id = v_invite.advisor_id
    RETURNING id INTO v_advisor_id;
  ELSE
    INSERT INTO noga.advisors (name, email, user_id, admin_id, is_active)
    VALUES (p_full_name, p_email, v_uid, v_invite.admin_id, true)
    RETURNING id INTO v_advisor_id;
  END IF;

  UPDATE noga.advisor_invites
  SET used_at         = now(),
      used_by_user_id = v_uid,
      advisor_id      = COALESCE(advisor_id, v_advisor_id)
  WHERE id = v_invite.id;

  RETURN v_advisor_id;
END;
$$;

REVOKE ALL ON FUNCTION noga.claim_advisor_invite(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION noga.claim_advisor_invite(text, text, text) TO authenticated;
