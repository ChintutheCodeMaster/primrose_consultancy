# Student Portal — "MyJourney"

A polished, supportive workspace the student opens via a private tokenized link (`/journey/:token`). Goal: every interaction feels seamless, professional, and on the student's side. The consultant sees everything that happens here from inside the CRM.

## Information architecture

A single page with a left rail and a main canvas. Sections (left rail):

1. **Home** — warm greeting, next 3 actions, upcoming deadlines, latest message from consultant.
2. **My Colleges** — read-only view of the working list (reach/target/likely/safety) with deadline countdowns and per-school status.
3. **Tasks** — checklist items the consultant assigns (essays, forms, recommendation requests). Each task can have a deadline, link, and attached docs.
4. **Documents** — versioned doc exchange (see below).
5. **Writing Lab** — AI workspace (essay feedback, brainstorm coach, grammar polish). Ethics-first.
6. **AI Detector** — paste/upload text → "likely AI-written" score + highlighted passages + reasoning. Educational, not punitive.
7. **Messages** — threaded chat with the consultant (lightweight; richer file talk lives inside each document version).
8. **Profile** — read-only summary of intake answers + a "Request an update" button.

Top bar: student's preferred name, consultant's name + avatar, "Need help?" link.

## Documents — versioned + inline comments

- **Per-document timeline.** Student creates a document (e.g. "Common App Personal Statement"). Each upload becomes v1, v2, v3… with timestamp and word count. Each version has a status: `draft → submitted → in review → changes requested → approved`.
- **Inline comments on the rendered text.** For .txt/.md/.docx (extracted to text) and pasted text, the version opens in a reader pane where consultant or student can select a range and leave a comment thread. Comments are anchored to the version; resolving a thread marks it done.
- **Binary files** (PDF, images) get version-level comments only — anchored highlights are not supported in this pass.
- **Notifications.** New comments / new versions trigger a "for you" pill in Home and a row in Messages.

## Writing Lab — ethical by design

One workspace with three modes the student toggles between:

- **Essay feedback** — student pastes/loads a draft + the prompt. AI returns: thesis check, structure outline of what's actually there, voice notes, prompt-fit gaps, three Socratic questions. **Never rewrites prose.**
- **Brainstorm coach** — guided chat that helps the student mine experiences, narrow themes, and build an outline. Stops at outline; refuses to draft paragraphs.
- **Grammar & clarity polish** — surface fixes only (typos, run-ons, awkward phrasing). Shows tracked-changes view; student must accept each change individually. Explicitly does not change ideas, voice, or structure.

Each mode banner displays an ethics note: "This tool helps you think and revise. The words must be yours — colleges expect your authentic voice."

Every Lab interaction is logged (mode, prompt, output) and visible to the consultant in their CRM view of the student. This is shown to the student up-front (trust + transparency).

## AI Detector

- Paste text or pull from a document version.
- Returns: overall score (0–100), confidence band, per-paragraph highlights, and a plain-English explanation of the signals (perplexity proxy, burstiness, vocabulary uniformity, sentence-length variance).
- Includes a clear disclaimer: "Heuristic indicator, not proof. Use it to gut-check your own drafts."
- Built on Lovable AI (Gemini). Free, immediate.

## Home (the emotional anchor)

- "Hi {preferred name} — you're on track."
- 3 next actions, deadline-sorted.
- A single ambient progress ring (% of tasks done in current phase: Discovery / List Building / Applications / Decisions).
- Latest consultant note + reply box.
- Quick links to Writing Lab and AI Detector.

## Technical details

### Auth model
Tokenized — student opens `/journey/:token`. Token is a row in `student_portal_tokens` (`student_id`, `token`, `status`, `expires_at`, `last_seen_at`). Rotatable + revocable from the CRM. No login screen.

### New tables
- `student_portal_tokens` — access control.
- `student_documents_v2` — `id, student_id, title, kind (essay/form/other), prompt_text, status`.
- `student_document_versions` — `id, document_id, version_no, body_text, file_url, file_mime, word_count, status, created_by ('student'|'consultant'), created_at`.
- `student_document_comments` — `id, version_id, anchor_start, anchor_end, author ('student'|'consultant'), body, resolved_at`.
- `student_messages` — `id, student_id, author, body, attachment_url, created_at`.
- `student_ai_sessions` — `id, student_id, mode ('feedback'|'brainstorm'|'polish'|'detector'), input_text, output_json, created_at`. Auditable + shown to consultant.
- `student_tasks` — `id, student_id, title, description, due_date, status, link_url, created_by`.
- Extend `students` with `phase ('discovery'|'list'|'applications'|'decisions')` and `preferred_name`.

All new tables: RLS enabled, permissive policies for now (matches current no-auth build), with GRANTs to anon + authenticated + service_role. When real auth lands in Phase 2, policies tighten to `student_id IN (current org's students)` for consultants and `token-bound` access for student-facing reads via an Edge Function.

### Edge functions
- `student-ai` — single function with `mode` parameter (`feedback | brainstorm | polish | detector`). Streams Gemini Flash. System prompts are server-side (never client). Refuses to produce drafted prose in feedback/brainstorm modes.
- `student-portal-auth` — validates token, returns scoped student data. Touches `last_seen_at`.

### Storage
- New bucket `student-portal-docs` (private). Versions store signed URLs.

### Routes
- `/journey/:token` — public, no MainLayout, custom student shell.
- Inside CRM: new "Student Portal" tab on the existing student record showing live mirror of everything above + AI session log + token management.

### Files (high level)
- `src/pages/StudentJourney.tsx` — token-validated shell + nav.
- `src/components/journey/Home.tsx`, `Colleges.tsx`, `Tasks.tsx`, `Documents.tsx`, `WritingLab.tsx`, `AiDetector.tsx`, `Messages.tsx`, `Profile.tsx`.
- `src/components/journey/DocumentReader.tsx` — versioned reader + inline comment anchors.
- `supabase/functions/student-ai/index.ts`, `supabase/functions/student-portal-auth/index.ts`.
- CRM-side: `src/components/students/StudentPortalMirror.tsx` mounted in the student record.

## Visual direction

- Calm, premium, "I am in good hands" — soft surfaces, generous spacing, warm primary, large readable type.
- Not a CRM. Not a school portal. Closer to Notion + Linear + a personal coach.
- Mobile-first: students will use phones constantly.

## Out of scope for this pass

- Google Docs–style live co-editing.
- Recommendation-letter solicitation workflow.
- Payments / billing visibility to students.
- Parent role (single shared link covers families for now).
- Real auth (token-only until Phase 2).

## Build order (suggested phases, each independently usable)

1. Token + shell + Home + Profile + read-only Colleges.
2. Tasks + Messages.
3. Documents (versioned uploads, status, inline comments for text).
4. Writing Lab (feedback → brainstorm → polish).
5. AI Detector.
6. CRM-side mirror tab + AI session log.
