-- =====================================================================
-- OAuth role assignment fix
--
-- Background: the email + password signup flow seeds public.user_roles via
-- the on_auth_user_created trigger reading raw_user_meta_data.role from
-- supabase.auth.signUp's options.data.role (see Register.tsx:141).
--
-- Google OAuth has no equivalent metadata channel, so OAuth users always
-- hit the trigger's default branch and land as 'student'. For Google
-- consultants invited via advisor_invites that's wrong.
--
-- Fix: redefine the two claim_*_invite RPCs to also UPSERT public.user_roles
-- with the role that matches the invite kind. SECURITY DEFINER lets them
-- cross schemas. ON CONFLICT DO NOTHING keeps it a no-op for the existing
-- email/password flow (where the trigger has already inserted the same row).
--
-- This file is a fresh timestamped migration — the previous claim RPC
-- definitions live in 20260624160000_invite_claim_rpcs.sql and are NOT
-- edited (per project rule against amending applied migrations).
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

  IF v_invite.used_at IS NOT NULL THEN
    IF v_invite.used_by_user_id = v_uid AND v_invite.student_id IS NOT NULL THEN
      -- Idempotent re-claim: still make sure the role row exists.
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_uid, 'student'::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
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

  -- Ensure the student role row exists (no-op for password flow, fix for OAuth).
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'student'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

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
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_uid, 'consultant'::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
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

  -- Ensure the consultant role row exists (no-op for password flow, fix for OAuth).
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'consultant'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_advisor_id;
END;
$$;

REVOKE ALL ON FUNCTION noga.claim_advisor_invite(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION noga.claim_advisor_invite(text, text, text) TO authenticated;
