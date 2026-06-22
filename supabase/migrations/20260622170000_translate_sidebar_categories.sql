-- =====================================================================
-- Translate seeded Hebrew sidebar category labels to English.
--
-- The sidebar (src/hooks/useSidebarCategories.ts) reads its grouped links
-- from noga.sidebar_categories.display_label. Seeded values are Hebrew;
-- this migration rewrites them so the sidebar renders English.
--
-- "Alumni" is used (not "Past Clients") to match the existing
-- "Move to Alumni" button on the student row.
--
-- Note on URL slugs: we deliberately do NOT change `year_value`. That
-- column is used as the URL path segment (e.g. /past-clients/2021-22),
-- and one row has a Hebrew slug ('2025-ומטה') that resolves to
-- /did-not-continue/2025-ומטה. Renaming the slug would break any
-- existing bookmarks or links; only the visible label is translated.
-- Switch the slug separately if/when you're ready to break those URLs.
--
-- Safe to re-run: each UPDATE is keyed on (category_type, year_value)
-- which is stable, and the value being written is English, so a second
-- execution is a no-op (no rows match the Hebrew literal anymore — but
-- the (type, year) WHERE still uniquely identifies the row, so the
-- write is identical English-on-English).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Inquiries (leads)
-- ---------------------------------------------------------------------
UPDATE noga.sidebar_categories SET display_label = 'Inquiries 27' WHERE category_type = 'leads' AND year_value = '27';
UPDATE noga.sidebar_categories SET display_label = 'Inquiries 26' WHERE category_type = 'leads' AND year_value = '26';
UPDATE noga.sidebar_categories SET display_label = 'Inquiries 25' WHERE category_type = 'leads' AND year_value = '25';
UPDATE noga.sidebar_categories SET display_label = 'Inquiries 24' WHERE category_type = 'leads' AND year_value = '24';
UPDATE noga.sidebar_categories SET display_label = 'Inquiries 23' WHERE category_type = 'leads' AND year_value = '23';

-- ---------------------------------------------------------------------
-- Alumni (past_clients)
-- ---------------------------------------------------------------------
UPDATE noga.sidebar_categories SET display_label = 'Alumni 2026'    WHERE category_type = 'past_clients' AND year_value = '2026';
UPDATE noga.sidebar_categories SET display_label = 'Alumni 2025'    WHERE category_type = 'past_clients' AND year_value = '2025';
UPDATE noga.sidebar_categories SET display_label = 'Alumni 2024'    WHERE category_type = 'past_clients' AND year_value = '2024';
UPDATE noga.sidebar_categories SET display_label = 'Alumni 2023'    WHERE category_type = 'past_clients' AND year_value = '2023';
UPDATE noga.sidebar_categories SET display_label = 'Alumni 2021-22' WHERE category_type = 'past_clients' AND year_value = '2021-22';

-- ---------------------------------------------------------------------
-- Closed / Did-not-continue
-- ---------------------------------------------------------------------
UPDATE noga.sidebar_categories SET display_label = '2025 and below' WHERE category_type = 'did_not_continue' AND year_value = '2025-ומטה';
UPDATE noga.sidebar_categories SET display_label = '2026'           WHERE category_type = 'did_not_continue' AND year_value = '2026';
UPDATE noga.sidebar_categories SET display_label = '2027'           WHERE category_type = 'did_not_continue' AND year_value = '2027';
UPDATE noga.sidebar_categories SET display_label = '2028'           WHERE category_type = 'did_not_continue' AND year_value = '2028';
