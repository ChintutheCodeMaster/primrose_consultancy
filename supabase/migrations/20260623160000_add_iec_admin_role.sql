-- =============================================================================
-- Add 'iec_admin' value to public.app_role
-- =============================================================================
-- The shared Supabase project (vbevikjfmrnaiqcaysnx) hosts both Noga and TPR.
-- TPR already uses role='admin' for its superadmin (TPR App.tsx → /super-admin
-- is gated to ['admin']). Granting a Noga IEC admin role='admin' would
-- inadvertently grant TPR superadmin privileges.
--
-- Solution: distinct enum value 'iec_admin' for the IEC tier in Noga.
-- TPR never references this value, so TPR is unaffected.
--
-- Idempotent on re-runs.
-- =============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'iec_admin';

-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction in older
-- Postgres versions. If this fails with "ALTER TYPE ... ADD cannot run inside
-- a transaction block", run it manually outside a transaction in the SQL editor.
