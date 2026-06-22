-- =====================================================================
-- Add 'consultant' to public.app_role
--
-- Live DB state (verified 2026-06-22): the enum already has the other
-- six values (student, counselor, admin, parent, principal, teacher),
-- deployed via TPR's earlier migrations. Only 'consultant' — needed by
-- Noga's signup flow — is missing.
--
-- public.handle_new_user is already the merged version (TPR's
-- 20260622000001_handle_new_user_inserts_role.sql) that seeds both
-- public.profiles and public.user_roles from raw_user_meta_data.role,
-- so no trigger changes are required here.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE cannot run inside a transaction
-- block. Run this file as its own standalone execution in the Supabase
-- SQL editor (or via `supabase db push` which handles it correctly).
-- =====================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';

-- Verify:
--   SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'public.app_role'::regtype
--   ORDER BY enumsortorder;
-- Expect: admin, counselor, parent, principal, student, teacher, consultant
