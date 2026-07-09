-- ============================================================================
-- Consultant trial + subscription tracking
-- ----------------------------------------------------------------------------
-- Adds trial + Stripe-subscription bookkeeping columns to noga.advisors.
--
-- Trial semantics:
--   * trial_started_at is NULL until the consultant first successfully logs in.
--   * On first login the client bumps it to now() (single write, idempotent
--     via `IS NULL` guard).
--   * The 7-day end date is computed in the client (trial_started_at + 7d)
--     because `timestamptz + interval` is stable — not immutable — and
--     therefore cannot back a stored generated column.
--   * subscription_status: 'trialing' (default) → 'active' (paid, set by
--     Stripe webhook later) → 'expired' (client can flip this once trial
--     window passes and no payment recorded).
--
-- One-shot intro-pricing popup:
--   * has_seen_intro_pricing is set true after the consultant closes the
--     first-login popup so it never fires again.
--
-- Stripe pointers are populated by a future webhook and left nullable now.
-- ============================================================================

ALTER TABLE noga.advisors
  ADD COLUMN IF NOT EXISTS trial_started_at       timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status    text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS has_seen_intro_pricing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Constrain subscription_status to known values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'advisors_subscription_status_check'
  ) THEN
    ALTER TABLE noga.advisors
      ADD CONSTRAINT advisors_subscription_status_check
      CHECK (subscription_status IN ('trialing', 'active', 'expired', 'canceled'));
  END IF;
END $$;

-- Consultants must be able to read and update their own trial + flag state
-- so the client can bump trial_started_at, flip has_seen_intro_pricing, and
-- read subscription_status without a service role.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'noga'
       AND tablename  = 'advisors'
       AND policyname = 'advisors_self_update_trial'
  ) THEN
    CREATE POLICY advisors_self_update_trial
      ON noga.advisors
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
