# Primrose IEC — Pivot Plan

Transform the existing Hebrew single-tenant "Noga" CRM into **Primrose IEC**, a multi-tenant English-language SaaS for Independent Educational Consultants (IECA-style: US college admissions, grad school, boarding school advising).

Because this is a very large pivot, I'll ship it in **5 phases**. Each phase is independently usable so you can preview, sell demos, and course-correct between phases.

---

## Phase 1 — Foundation: rebrand, English UI, LTR layout

Goal: the app looks and reads like an English product overnight, even though business logic still matches the Noga model.

- Rebrand to **Primrose IEC**: app name, logo placeholder, favicon, `index.html` title + meta description + JSON-LD (SoftwareApplication), README.
- Flip `<html dir="rtl" lang="he">` → `dir="ltr" lang="en"`. Audit Tailwind for `mr-*/ml-*`, `right-*/left-*`, `text-right/left`, `flex-row-reverse` — swap to logical equivalents (`ms-*/me-*`, `start/end`) where it matters.
- Translate every visible UI string to American English. Map Hebrew domain terms → IEC vocabulary:
  - מתעניינים → **Inquiries**
  - סטודנטים → **Students**
  - לקוחות עבר → **Alumni**
  - לא המשיכו → **Closed/Lost**
  - יועצים → **Consultants** (and Past Consultants)
  - הסכם → **Engagement Agreement**
  - פגישה / סיכום פגישה → **Meeting Notes**
  - מקור הגעה → **Lead Source**
  - תחום לימודים → **Field of Interest**
- Replace Israeli specifics: ₪ → $, VAT (17%) toggle, Israeli phone format → international (libphonenumber).
- Replace the Wix webhook with a generic "Website Inquiry Webhook" page in Settings that gives the consultant their unique URL + sample payload (works for Wix, Squarespace, WordPress, Calendly, Typeform, etc.).
- Keep Noga's data shape for now — just translate enums (`active/accepted/enrolled/graduated/paused` already English; surface them with friendly labels).

---

## Phase 2 — Multi-tenant SaaS infrastructure

Goal: each consultant or firm signs up, gets isolated data, can invite colleagues.

- Enable **Lovable Cloud auth**: email/password + Google sign-in. Replace the `PasswordGate` + `NogaNoga123` localStorage gate entirely.
- New tables:
  - `organizations` (firm name, plan, billing email, logo, brand color, currency, timezone)
  - `profiles` (1:1 with auth.users — name, avatar, default org)
  - `organization_members` (user_id, org_id, role: owner/admin/consultant/assistant/viewer)
  - `user_roles` via security-definer `has_role()` function (per project rules — never store roles on profiles)
- Add `organization_id uuid not null` to every existing tenant-scoped table (`students`, `leads`, `advisors`, `projects`, `student_documents`, `agreements`, `ai_conversations`, `sidebar_categories`, `source_options`, `country_options`, `field_options`, etc.).
- Rewrite every RLS policy: `using (organization_id = current_org_id())` via a security-definer helper that reads the active org from JWT claims or `organization_members`.
- Active-organization switcher in the header for users who belong to multiple firms.
- Invite-by-email flow with role assignment; pending invites table.
- Password reset page at `/reset-password`.

---

## Phase 3 — IECA workflow adaptation (the part that makes it sellable)

Goal: the data model speaks "college admissions consultant," not generic CRM.

New first-class concepts on the Student record:

- **Student profile**: graduation year, current school, GPA (weighted/unweighted), test scores (SAT/ACT/IELTS/TOEFL/GRE/GMAT) with date + superscore, intended majors (multi), extracurriculars, hooks.
- **College list builder**: a `student_colleges` table with college name, type (reach/target/likely), application plan (ED/ED2/EA/REA/RD/Rolling), deadline, status (researching/in-progress/submitted/accepted/waitlisted/deferred/denied/enrolled), application portal (Common App / Coalition / direct / UC / ApplyTexas), supplemental essays required, recommendation count, fee.
- **Application tasks/checklists** auto-generated per college from a template library (essays, recs, transcript, test scores, FA forms, interview).
- **Essay tracker**: drafts, status, word count, deadline, link to Google Doc.
- **Recommendation tracker**: teacher/counselor, subject, request status, submitted date.
- **Meeting log**: replaces "contact documentation," with meeting type (intro, working session, college list, essay review, decision), duration → billable hours.
- **Hours & retainer ledger** (replaces ₪ package logic): hourly rate, retainer balance, sessions logged → automatic billing math, all in USD by default but currency is per-org.
- **Decision dashboard per student**: a visual board of all schools with status pills, deadlines countdown, and admit/deny outcomes.
- **Parent contacts**: separate child entity on Student (name, email, phone, relationship) since IECs always work with parents.

Seed data: a "Common 50" US universities + top international list pre-loaded into `target_university_options`; a default IECA-style checklist template per application plan.

---

## Phase 4 — Marketing site + onboarding + billing

Goal: someone arriving from IECA can self-serve sign up and pay.

- Public marketing pages at `/` (replaces the current `Index` dashboard, which moves to `/app`):
  - Hero, problem/solution, features, screenshots, pricing, testimonials, FAQ, CTA.
  - Sections written for IECs: "Built for independent educational consultants," "Manage 50+ students without losing the thread," "Track every college on every student's list."
  - Proper SEO: title, meta description, canonical, OG tags, JSON-LD SoftwareApplication + Organization.
- Sign-up flow → onboarding wizard: org name, brand color, currency, timezone, invite teammates, sample data toggle.
- **Pricing/billing via Lovable's built-in Stripe payments**: Solo ($X/mo), Practice ($Y/mo, 5 seats), Firm ($Z/mo, unlimited seats). Free 14-day trial.

---

## Phase 5 — Polish, docs, launch prep

- Email branding: Primrose IEC sender domain, branded auth emails (signup, reset, invite).
- In-app onboarding tour, empty-state coaching, sample student.
- Help center page with how-to articles for the IEC workflows.
- Security review: run `supabase--linter`, confirm RLS on every tenant-scoped table, HIBP password check on, no email auto-confirm.
- Public remix off; legal pages (Terms, Privacy, DPA stub).

---

## What I'd build right now (Phase 1)

If you approve, I'll start Phase 1 in this run:

1. Update `index.html` (title, meta, lang/dir, JSON-LD) and project name.
2. Build a `src/i18n/en.ts` dictionary covering the most-trafficked pages — Sidebar, Dashboard, Inquiries (Leads), Students, Settings, Login gate — and swap the literals in those files.
3. Translate all enum labels and dropdown defaults (sources, countries, fields) via a migration that seeds English equivalents in `source_options`, `country_options`, `field_options`, `target_university_options`.
4. Currency switch: replace hard-coded ₪ with a `formatCurrency()` helper defaulting to USD, VAT toggle defaulting off.
5. New landing/marketing page draft at `/` (current Dashboard moves to `/app`).

Phases 2–5 each become their own plan when you're ready.

---

## Technical notes

- Multi-tenancy: prefer **shared schema + `organization_id` column + RLS** over schema-per-tenant. Cleaner migrations, cheaper, and Supabase RLS handles isolation safely.
- Active org resolution: store `active_organization_id` in `profiles`; expose via a `current_org_id()` SQL function used in all RLS policies. Switching orgs = update profile + refresh queries.
- Existing Noga data: since the product is going multi-tenant, the current single dataset will be wrapped into a default "Noga" org so nothing is lost during migration; you keep using your own instance and new sign-ups are isolated.
- Hebrew text in DB (existing source/country options, sidebar labels): keep as-is for the Noga org, seed English defaults for new orgs.
- IECA trademark: avoid using "IECA" in product name/marketing (it's a member organization); position as "for independent educational consultants."

---

**Scope check before I start:** This pivot is roughly 5–10x the size of a normal change request. Phase 1 alone is a multi-hour build touching ~40+ files. I'll execute Phase 1 end-to-end once you approve, then pause for your review before Phase 2.