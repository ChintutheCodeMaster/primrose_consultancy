-- =====================================================================
-- Phase 1 — Auth foundation
-- Creates: public.app_role enum, public.user_roles table, RLS policies,
--          public.handle_new_user trigger on auth.users,
--          public.current_user_has_role helper (used by Phase 5 RLS).
--
-- Target schema: public (NOT noga). This table is shared with TPR
-- (sister app on the same Supabase project), so it must live in the
-- default schema both apps already query.
--
-- Idempotent on a fresh DB. If the app_role enum already exists from a
-- prior TPR migration, see "EXTENDING AN EXISTING ENUM" note at bottom.
-- =====================================================================

-- 1. Role enum (union of Noga + TPR roles)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'student',
      'consultant',
      'parent',
      'counselor',
      'admin',
      'principal',
      'teacher'
    );
  END IF;
END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx
  ON public.user_roles (user_id);

-- 3. Row Level Security — strict from day one
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_roles_service_write ON public.user_roles;
CREATE POLICY user_roles_service_write
  ON public.user_roles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Privileges — anon never sees roles; authenticated reads its own (RLS-filtered)
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

-- 5. handle_new_user — auto-seeds a user_roles row after signup
--    Reads `role` from raw_user_meta_data (pass at signUp time);
--    defaults to 'student' if missing or invalid.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'student'::public.app_role
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'student'::public.app_role;
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Helper for downstream RLS (Phase 5 will lean on this)
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
-- EXTENDING AN EXISTING ENUM
-- If public.app_role already exists (e.g. created by TPR earlier) and
-- is missing 'consultant', run this ONCE in a SEPARATE SQL editor tab
-- (ALTER TYPE ... ADD VALUE cannot run inside a transaction block):
--
--   ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';
-- =====================================================================
