-- =====================================================================
-- Phase 1 — Merge with existing TPR auth infrastructure
--
-- Context: The shared Supabase project (vbevikjfmrnaiqcaysnx) already
-- holds TPR's original public schema:
--   - public.app_role enum: student | counselor | admin
--   - public.user_roles  (id, user_id, role, UNIQUE(user_id, role))
--   - public.handle_new_user()  -- inserts into public.profiles only
--   - on_auth_user_created trigger pointing at the above
--
-- The earlier Noga migration (20260620120000_auth_phase1_user_roles.sql)
-- was authored for a fresh DB and was a no-op against the live TPR DB
-- because the enum and table already existed. This migration brings the
-- live DB up to the state Noga needs WITHOUT breaking TPR:
--   1. Extends app_role with the four roles Noga needs (consultant +
--      parent, principal, teacher to match the union plan).
--   2. Adds the missing created_at column on public.user_roles.
--   3. Replaces public.handle_new_user() with a merged version that
--      preserves TPR's profiles seed AND adds Noga's user_roles seed,
--      but only when raw_user_meta_data carries an explicit `role`.
--      TPR's existing signup flow (no role in metadata) continues to
--      get a profiles row and no user_roles row — exactly today's
--      behavior.
--   4. Re-points the trigger at the merged function.
--
-- TPR's 28 existing user_roles rows are untouched. Noga's noga.* schema
-- is untouched. Zero data migration. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 1 — Extend app_role enum
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE cannot run inside a transaction
-- block. Paste this STEP 1 section into its own SQL editor execution
-- BEFORE running the rest of the file. Each ADD VALUE is idempotent
-- thanks to IF NOT EXISTS.
-- ---------------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- =====================================================================
-- STOP. Run everything above this line first (its own execution).
-- Then run everything below as a second execution.
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 2 — Bring public.user_roles up to Noga's expected shape
--
-- TPR's table already has: id (uuid PK), user_id (FK CASCADE),
-- role (app_role NOT NULL DEFAULT 'student'), UNIQUE(user_id, role).
-- Missing: created_at.
-- ---------------------------------------------------------------------
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx
  ON public.user_roles (user_id);

-- ---------------------------------------------------------------------
-- STEP 3 — Merged handle_new_user
--
-- Behavior:
--   - Always inserts a profiles row (matches TPR's current contract).
--   - If raw_user_meta_data carries a `role` key AND that value casts
--     to a valid app_role, also inserts a user_roles row.
--   - If `role` is absent or invalid, NO user_roles row is created.
--     This preserves TPR's existing behavior where roles are managed
--     out-of-band (their 28 rows were seeded that way).
--
-- Noga's signup code passes `role: 'consultant'` / 'student' / etc.
-- in options.data, so Noga users get their user_roles row automatically.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- TPR's original profiles seed (unchanged)
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    ),
    NEW.email
  );

  -- Noga's user_roles seed — only when metadata carries an explicit role
  IF NEW.raw_user_meta_data ? 'role'
     AND NULLIF(NEW.raw_user_meta_data ->> 'role', '') IS NOT NULL THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, v_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN invalid_text_representation THEN
      -- Unknown role string in metadata — skip silently, don't break signup.
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- STEP 4 — Re-point the trigger at the merged function
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- STEP 5 — current_user_has_role helper (used by Phase 5 RLS)
-- Idempotent; safe if it already exists from the earlier migration.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_has_role(check_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = check_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.app_role) TO authenticated;

-- =====================================================================
-- VERIFICATION (run after both executions)
--
-- 1. Enum has all 7 values:
--      SELECT enumlabel FROM pg_enum
--      WHERE enumtypid = 'public.app_role'::regtype ORDER BY enumsortorder;
--
-- 2. user_roles has created_at:
--      SELECT column_name FROM information_schema.columns
--      WHERE table_schema='public' AND table_name='user_roles';
--
-- 3. Trigger points at merged function:
--      SELECT tgname, tgfoid::regproc FROM pg_trigger
--      WHERE tgname = 'on_auth_user_created';
--
-- 4. Signup with role='consultant' creates one user_roles row;
--    signup with no metadata creates zero user_roles rows
--    (TPR's existing behavior).
-- =====================================================================
