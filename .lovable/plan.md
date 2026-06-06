# Student Portal v2 — Counselor ↔ Student Workspace

## Goal
Turn the existing `/journey/:token` (student side) and `/student-portal/:studentId` (counselor side) into the single working hub for the admissions cycle: link generation → onboarding → profile → document exchange → progress tracking → ongoing conversation.

Keep magic-link auth (Phase 2 will add real auth). Retire the older duplicate `/portal/:studentId`.

---

## 1. Link generation (counselor side)
Already exists in `StudentJourneyTokenPanel` + `student_portal_tokens` table. Polish:
- Move "Generate portal link" to a prominent button on the **student detail page** (currently buried under `/student-portal/:id`).
- Add: copy link, email link (mailto), revoke, regenerate, last-accessed timestamp, expiry date control.
- Auto-create a token the moment a lead is converted to a student, so no extra click is needed.

## 2. Student onboarding (first visit)
New `JourneyOnboarding` step that runs the first time a token is opened and `student_profile_extras.onboarded_at` is null. Single multi-step form that writes to `students` + `student_profile_extras`:
1. Confirm name, email, phone, graduation year, current school
2. Academic snapshot — GPA, test scores (SAT/ACT/AP/IB), class rank
3. Interests — fields of study (multi), target countries (multi), career goals (free text)
4. Activities & awards (repeatable rows)
5. Family info — parent name/email/phone (used later for parent CC)
6. Consent + "Let's begin"

On finish: mark onboarded, send counselor a notification in their dashboard "Attention" section.

## 3. Student profile (always-on)
Replace today's thin `JourneyProfile` with a real profile dashboard. Two views of the same data:
- **Student view** — editable cards (Academic, Interests, Activities, Family, About me, Essays-in-progress).
- **Counselor view** — same cards read-only with an "Edit on behalf" toggle and an internal-notes panel only the counselor sees (`student_profile_extras.counselor_notes`).

## 4. Progress bar / admissions cycle tracker
New `JourneyProgress` component shown at top of student Home and counselor portal:
- Cycle stages: Onboarding → Profile complete → College list locked → Essays in progress → Applications submitted → Decisions in → Enrolled.
- Each stage computed from real data (e.g. "College list locked" = `student_colleges.locked_at` set; "Applications submitted" = % of `applied_universities` with status submitted).
- Visual: segmented bar + % complete + "next action" CTA.
- Per-college mini-progress (essays done / recs in / submitted / decision) on the college list rows.

## 5. Document exchange
Upgrade `JourneyDocuments` (uses `student_documents_v2` + Storage bucket `student-portal-docs`):
- Folders: Application docs, Essays, Transcripts, Recommendations, Financial aid, Acceptance letters, Other.
- Both sides can upload, download, rename, delete own uploads, mark "needs counselor review" / "approved".
- Versioning already supported by `student_document_versions` — surface a version dropdown + diff date.
- Threaded comments per document via `student_document_comments`.
- Counselor can "request a document" → creates a placeholder row + task for the student.

## 6. Messages
Keep `JourneyMessages` (`student_messages`) but add:
- File attachments (reuse the doc bucket)
- Unread badge on both sides
- Realtime via `ALTER PUBLICATION supabase_realtime ADD TABLE public.student_messages`
- Optional parent CC (uses parent email from onboarding)

## 7. Tasks / checklist
Keep `JourneyTasks` + `student_tasks`. Add:
- Counselor task templates (e.g. "Common App essay draft 1", "Request transcript") that can be applied per-student or per-college.
- Due-date reminders shown on student Home and counselor dashboard "Attention" section.

## 8. Counselor-side workspace (`/student-portal/:studentId`)
Reorganize `StudentPortalManagement.tsx` into tabs that mirror the student's view 1-to-1, plus a "Token & access" tab. Today it's a long scroll; tabs = Overview / Profile / Colleges / Documents / Messages / Tasks / Access.

## 9. Cleanup
- Delete `src/pages/StudentPortal.tsx` and its `/portal/:studentId` route (duplicate of `/journey`).
- Remove the old route from `App.tsx` and any sidebar/menu references.

---

## Technical section

### Schema changes (one migration)
- `student_profile_extras`: add `onboarded_at timestamptz`, `counselor_notes text`, `parent_name text`, `parent_email text`, `parent_phone text`, `activities jsonb`, `awards jsonb`, `career_goals text`, `about_me text`.
- `student_colleges`: add `locked_at timestamptz`, `essays_status text`, `recs_status text`.
- `student_documents_v2`: add `folder text default 'other'`, `review_status text default 'none'` (none / requested / approved), `requested_by text`.
- `student_messages`: add `attachment_path text`, `read_at timestamptz`, `cc_parent boolean default false`.
- `student_tasks`: add `template_key text`, `college_id uuid references student_colleges(id) on delete set null`.
- Realtime: add `student_messages`, `student_documents_v2`, `student_tasks` to `supabase_realtime` publication.
- All new columns are nullable / defaulted so existing rows are safe. No new tables.

### Frontend
- New components: `JourneyOnboarding`, `JourneyProgress`, `JourneyParentInfo`, `DocumentFolderTabs`, `DocumentCommentsPanel`, `RequestDocumentDialog`, `TaskTemplatePicker`, `CounselorNotesPanel`.
- Refactor `StudentPortalManagement.tsx` to a tabbed shell that imports the same Journey* components in a `mode="counselor"` variant (read-only + admin actions).
- Auto-create portal token in the lead→student conversion handler.
- Realtime subscriptions in `JourneyMessages` and `JourneyDocuments`.

### Out of scope (will mention but not build now)
- Real student auth (Phase 2)
- Video calls / scheduling
- White-label branding per IEC (Phase 2 multi-tenant)
- Payments inside the portal

---

## Delivery order
1. Schema migration + retire `/portal/:studentId`
2. Onboarding flow + profile rewrite
3. Progress tracker
4. Document exchange upgrade (folders, review, comments, request)
5. Messages upgrade (attachments + realtime + unread)
6. Tasks templates + per-college tasks
7. Counselor tabbed workspace + auto token on conversion
