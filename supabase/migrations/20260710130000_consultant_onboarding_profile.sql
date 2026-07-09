-- ============================================================================
-- Consultant onboarding wizard — profile + practice fields
-- ----------------------------------------------------------------------------
-- Adds the fields collected by the 4-step first-login onboarding wizard
-- ({first,last}_name, company, website, practice focus) plus a one-shot flag
-- so the wizard fires exactly once per consultant.
--
-- All fields are nullable — the wizard writes them in one batched update on
-- completion. `has_completed_onboarding` gates whether the wizard renders on
-- subsequent logins; flipped to true only when the consultant clicks
-- "Create My First Student" on step 4.
--
-- Values for the practice dropdowns are stored as free-form text so the
-- product team can iterate on options without a follow-up migration.
-- ============================================================================

ALTER TABLE noga.advisors
  ADD COLUMN IF NOT EXISTS first_name              text,
  ADD COLUMN IF NOT EXISTS last_name               text,
  ADD COLUMN IF NOT EXISTS company_name            text,
  ADD COLUMN IF NOT EXISTS website                 text,
  ADD COLUMN IF NOT EXISTS primary_program         text,
  ADD COLUMN IF NOT EXISTS students_per_year       text,
  ADD COLUMN IF NOT EXISTS primary_destinations    text,
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;
