-- =====================================================================
-- Fix: onboarding_answers UPSERT was failing with 42P10
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" because the previous migration left user_id nullable
-- without a unique constraint, but the client does upsert(..., { onConflict: 'user_id' }).
--
-- We collapse any duplicate user_id rows (keep the most recent) and then
-- add a UNIQUE constraint so ON CONFLICT (user_id) works.
-- =====================================================================

-- 1. Dedupe — keep the newest row per user_id, drop the rest
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
         ) AS rn
  FROM noga.onboarding_answers
  WHERE user_id IS NOT NULL
)
DELETE FROM noga.onboarding_answers oa
USING ranked
WHERE oa.id = ranked.id
  AND ranked.rn > 1;

-- 2. Add the unique constraint (NULL user_ids are allowed and don't collide)
ALTER TABLE noga.onboarding_answers
  ADD CONSTRAINT onboarding_answers_user_id_key UNIQUE (user_id);
