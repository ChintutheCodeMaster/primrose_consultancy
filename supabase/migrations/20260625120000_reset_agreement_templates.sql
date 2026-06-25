-- Reset legacy Hebrew agreement_templates rows so the app's built-in
-- English defaults (hourly / package / other) become the source of truth
-- on the Engagement Agreements editor.
--
-- Safe to re-run: a no-op once the legacy rows are gone.

delete from noga.agreement_templates
where type in ('hourly', 'package', 'mba', 'edit');
