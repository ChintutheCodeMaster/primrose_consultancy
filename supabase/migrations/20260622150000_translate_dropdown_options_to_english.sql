-- =====================================================================
-- Translate seeded Hebrew dropdown options to English.
--
-- The AddStudentDialog (and other forms) read their "Lead Source" and
-- "Desired Country" dropdowns from noga.source_options / noga.country_options.
-- Both tables were seeded with Hebrew values, which now need to be English
-- for the consultant-facing UI.
--
-- Safe to re-run: WHERE clauses match on the Hebrew literals, so a second
-- execution becomes a no-op once the rows are already English.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lead sources
-- ---------------------------------------------------------------------
UPDATE noga.source_options SET name = 'LinkedIn'                WHERE name = 'לינקדאין';
UPDATE noga.source_options SET name = 'Facebook'                WHERE name = 'פייסבוק';
UPDATE noga.source_options SET name = 'Google'                  WHERE name = 'גוגל';
UPDATE noga.source_options SET name = 'Podcast'                 WHERE name = 'פודקאסט';
UPDATE noga.source_options SET name = 'Past Candidate Referral' WHERE name = 'המלצה ממועמד עבר';
UPDATE noga.source_options SET name = 'UK Studies Community'    WHERE name = 'קהילת לימודים באנגליה';
UPDATE noga.source_options SET name = 'Instagram'               WHERE name = 'אינסטגרם';

-- ---------------------------------------------------------------------
-- Desired countries
-- ---------------------------------------------------------------------
UPDATE noga.country_options SET name = 'UK'          WHERE name = 'אנגליה';
UPDATE noga.country_options SET name = 'USA'         WHERE name = 'ארה״ב';
UPDATE noga.country_options SET name = 'Canada'      WHERE name = 'קנדה';
UPDATE noga.country_options SET name = 'Netherlands' WHERE name = 'הולנד';
UPDATE noga.country_options SET name = 'Germany'     WHERE name = 'גרמניה';
UPDATE noga.country_options SET name = 'Australia'   WHERE name = 'אוסטרליה';
