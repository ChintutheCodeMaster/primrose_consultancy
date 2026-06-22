-- =====================================================================
-- Cascade the Hebrew→English translation onto existing record values.
--
-- The previous migration (20260622150000_translate_dropdown_options_to_english.sql)
-- renamed the rows in noga.source_options / noga.country_options so that
-- *new* selections show English. This migration normalizes the values
-- already stored on existing rows in noga.students and noga.leads so the
-- Alumni / Closed-Lost edit dialogs and any other display surface render
-- English. The Select's `value` prop comes from the row itself, not the
-- option list — so without this pass, old records keep showing Hebrew.
--
-- Safe to re-run: each UPDATE matches on the Hebrew literal, so a second
-- execution becomes a no-op once the rows are already English.
-- =====================================================================

-- ---------------------------------------------------------------------
-- students.source
-- ---------------------------------------------------------------------
UPDATE noga.students SET source = 'LinkedIn'                WHERE source = 'לינקדאין';
UPDATE noga.students SET source = 'Facebook'                WHERE source = 'פייסבוק';
UPDATE noga.students SET source = 'Google'                  WHERE source = 'גוגל';
UPDATE noga.students SET source = 'Podcast'                 WHERE source = 'פודקאסט';
UPDATE noga.students SET source = 'Past Candidate Referral' WHERE source = 'המלצה ממועמד עבר';
UPDATE noga.students SET source = 'UK Studies Community'    WHERE source = 'קהילת לימודים באנגליה';
UPDATE noga.students SET source = 'Instagram'               WHERE source = 'אינסטגרם';

-- ---------------------------------------------------------------------
-- students.interested_country
-- ---------------------------------------------------------------------
UPDATE noga.students SET interested_country = 'UK'          WHERE interested_country = 'אנגליה';
UPDATE noga.students SET interested_country = 'USA'         WHERE interested_country = 'ארה״ב';
UPDATE noga.students SET interested_country = 'Canada'      WHERE interested_country = 'קנדה';
UPDATE noga.students SET interested_country = 'Netherlands' WHERE interested_country = 'הולנד';
UPDATE noga.students SET interested_country = 'Germany'     WHERE interested_country = 'גרמניה';
UPDATE noga.students SET interested_country = 'Australia'   WHERE interested_country = 'אוסטרליה';

-- ---------------------------------------------------------------------
-- students.target_country
-- ---------------------------------------------------------------------
UPDATE noga.students SET target_country = 'UK'          WHERE target_country = 'אנגליה';
UPDATE noga.students SET target_country = 'USA'         WHERE target_country = 'ארה״ב';
UPDATE noga.students SET target_country = 'Canada'      WHERE target_country = 'קנדה';
UPDATE noga.students SET target_country = 'Netherlands' WHERE target_country = 'הולנד';
UPDATE noga.students SET target_country = 'Germany'     WHERE target_country = 'גרמניה';
UPDATE noga.students SET target_country = 'Australia'   WHERE target_country = 'אוסטרליה';

-- ---------------------------------------------------------------------
-- leads.source
-- ---------------------------------------------------------------------
UPDATE noga.leads SET source = 'LinkedIn'                WHERE source = 'לינקדאין';
UPDATE noga.leads SET source = 'Facebook'                WHERE source = 'פייסבוק';
UPDATE noga.leads SET source = 'Google'                  WHERE source = 'גוגל';
UPDATE noga.leads SET source = 'Podcast'                 WHERE source = 'פודקאסט';
UPDATE noga.leads SET source = 'Past Candidate Referral' WHERE source = 'המלצה ממועמד עבר';
UPDATE noga.leads SET source = 'UK Studies Community'    WHERE source = 'קהילת לימודים באנגליה';
UPDATE noga.leads SET source = 'Instagram'               WHERE source = 'אינסטגרם';

-- ---------------------------------------------------------------------
-- leads.interested_country
-- ---------------------------------------------------------------------
UPDATE noga.leads SET interested_country = 'UK'          WHERE interested_country = 'אנגליה';
UPDATE noga.leads SET interested_country = 'USA'         WHERE interested_country = 'ארה״ב';
UPDATE noga.leads SET interested_country = 'Canada'      WHERE interested_country = 'קנדה';
UPDATE noga.leads SET interested_country = 'Netherlands' WHERE interested_country = 'הולנד';
UPDATE noga.leads SET interested_country = 'Germany'     WHERE interested_country = 'גרמניה';
UPDATE noga.leads SET interested_country = 'Australia'   WHERE interested_country = 'אוסטרליה';
