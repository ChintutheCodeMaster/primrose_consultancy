-- =============================================================================
-- Noga — IEC → Consultant → Student hierarchy
-- =============================================================================
-- Models the "one admin per IEC" tier and tightens the consultant signup hole
-- by adding an invite mechanism that mirrors student_invites.
--
-- Hierarchy (after this migration):
--   auth.users (admin)                  -- one per IEC, manually provisioned
--       ↓ noga.advisors.admin_id
--   noga.advisors (consultants)         -- self-signup REMOVED; invite-only
--       ↓ noga.students.advisor_id (pre-existing)
--   noga.students                       -- already invite-only
--
-- Decisions:
--   * noga.admins is a small table mirroring noga.advisors / noga.students.
--     Holds IEC-level metadata (org name, contact email). user_id links to
--     auth.users so the same identity bridge works.
--   * noga.advisors.admin_id is nullable. Existing advisors keep working
--     until you assign them via the admin UI or via SQL.
--   * noga.advisor_invites mirrors noga.student_invites — token-based,
--     30-day default expiry, unique partial index on (admin_id) where
--     used_at IS NULL so an admin can only have one outstanding invite
--     per... actually, scratch that — admins can have many open invites
--     (one per consultant being onboarded). So the unique partial index
--     is on (token), which CREATE TABLE already enforces via UNIQUE.
--   * RLS permissive to match the rest of noga.*. Tightening is Phase 3.
-- =============================================================================

-- ---------------------------------------------------------------------
-- 1. noga.admins — IEC root accounts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  org_name    text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_unique
  ON noga.admins (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique
  ON noga.admins (lower(email));

ALTER TABLE noga.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admins_all ON noga.admins;
CREATE POLICY admins_all ON noga.admins FOR ALL USING (true) WITH CHECK (true);

-- Reuse Noga's existing updated_at trigger function
DROP TRIGGER IF EXISTS admins_set_updated_at ON noga.admins;
CREATE TRIGGER admins_set_updated_at
  BEFORE UPDATE ON noga.admins
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 2. noga.advisors — link to admin (IEC root)
-- ---------------------------------------------------------------------
ALTER TABLE noga.advisors
  ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES noga.admins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS advisors_admin_id_idx
  ON noga.advisors (admin_id);

-- ---------------------------------------------------------------------
-- 3. noga.advisor_invites — admin-generated consultant registration links
--
-- Flow:
--   * Admin clicks "Invite a consultant" → row inserted with
--     admin_id = the admin's noga.admins.id, optional pre-filled email/name.
--   * Consultant visits /register?invite=<token> → frontend resolves the
--     row, runs supabase.auth.signUp with role='consultant', then in a
--     client-side follow-up INSERTs a noga.advisors row with
--     admin_id from the invite, and marks the invite consumed.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.advisor_invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token             text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  admin_id          uuid NOT NULL REFERENCES noga.admins(id) ON DELETE CASCADE,
  advisor_id        uuid REFERENCES noga.advisors(id) ON DELETE CASCADE,
  email             text,
  name              text,
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at           timestamptz,
  used_by_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS advisor_invites_admin_id_idx
  ON noga.advisor_invites (admin_id);

CREATE INDEX IF NOT EXISTS advisor_invites_unused_idx
  ON noga.advisor_invites (token)
  WHERE used_at IS NULL;

ALTER TABLE noga.advisor_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advisor_invites_all ON noga.advisor_invites;
CREATE POLICY advisor_invites_all
  ON noga.advisor_invites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Verification + first-admin bootstrap
--
-- To seed your first admin (one-time SQL, no UI for this):
--
--   1) Create an auth user via Supabase dashboard or signUp.
--   2) Insert into public.user_roles:
--        INSERT INTO public.user_roles (user_id, role)
--        VALUES ('<auth.uid>', 'admin');
--   3) Insert into noga.admins:
--        INSERT INTO noga.admins (user_id, name, email, org_name)
--        VALUES ('<auth.uid>', 'Admin Name', 'admin@iec.com', 'IEC Org Name');
--   4) Optionally backfill existing advisors:
--        UPDATE noga.advisors SET admin_id = '<noga.admins.id>'
--        WHERE admin_id IS NULL;
-- =============================================================================
