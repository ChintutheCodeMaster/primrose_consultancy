-- =====================================================================
-- Rename the Hebrew URL slug on the did_not_continue sidebar entry.
--
-- The previous migration (20260622170000_translate_sidebar_categories.sql)
-- only translated `display_label`. The matching `year_value` for the
-- "2025 and below" row was still Hebrew ('2025-ומטה'), which is used as
-- the URL path segment (/did-not-continue/2025-ומטה).
--
-- DidNotContinue.tsx already branched on the English form when picking
-- which records to include in the filter, but with a typo
-- ('2025-and below' — hyphen + space). Both ends are now aligned to
-- '2025-and-below' (clean hyphens, no URL-encoded space):
--   * code:  src/pages/DidNotContinue.tsx (year === '2025-and-below')
--   * DB:    noga.sidebar_categories.year_value = '2025-and-below'
--
-- After this runs, sidebar link → /did-not-continue/2025-and-below,
-- and the page filter picks up records with graduation_year <= 2025.
--
-- Idempotent: matches on the Hebrew literal, so a second run is a no-op.
-- =====================================================================

UPDATE noga.sidebar_categories
SET year_value = '2025-and-below'
WHERE category_type = 'did_not_continue'
  AND year_value = '2025-ומטה';
