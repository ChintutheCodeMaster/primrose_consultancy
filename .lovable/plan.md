## Goal

Turn the consultant ↔ student relationship from "two separate CRUD views" into one **shared, live workspace** per student. Both sides see the same activity in real time, can comment in-line on artifacts, and always know whether the other person has seen the latest update.

## What ships

### 1. Unified Activity Feed (the spine)
A single chronological stream, per student, that consultant and student both see — the "what's happening here" surface.

Events surfaced:
- New message (existing `student_messages`)
- Essay version posted, status changed, comment added
- College added/removed/status changed on the list
- Task created/completed
- Acceptance logged
- File uploaded
- Calendar event scheduled

Two render locations:
- **Consultant side**: new tab on the student detail page → "Activity"
- **Student side**: new section on `JourneyHome` → "What's new"

Both sides get filter chips (Messages · Essays · Colleges · Tasks · Files) and a relative timestamp ("2h ago"). Click any item to deep-link to the artifact.

### 2. Live presence + read receipts
- A small "Consultant is viewing" / "Student is viewing" pill at the top of the workspace, powered by Supabase Realtime presence channels.
- `last_seen_at` per side, per student → unread badges in the consultant sidebar and on the student journey home.
- `student_messages.read_at` already exists; extend with `consultant_read_at` so we can show both sides' read state on any thread.

### 3. Inline comments on essays (Google-Docs style)
- `student_document_comments` already exists (anchor_start/end) — wire it into the WritingLab editor so consultants can highlight a passage and leave a comment that the student sees inline.
- Comments thread, resolve, and emit feed events.
- "@-mention the other side" → triggers a notification (in-app badge + optional email).

### 4. Shared notes per student (the "between us" pad)
A free-form markdown notepad each student page carries. Consultant and student edit it together; auto-saved. Use case: weekly agenda, running list of decisions, "things to ask mom about." Realtime-synced.

### 5. Unread badges across the app
- Consultant sidebar Students count badge → number of students with new activity since `last_seen_at`.
- Per-student row in the Students list → small dot when unread.
- Student journey home → unread count on Messages / Essays.

## Why this set, in this order

These five together are what makes a workspace *feel* shared rather than two parallel CRUDs. The feed is the spine; presence/read receipts make it feel live; inline comments solve the highest-value real workflow (essay review); shared notes give the relationship a "place"; unread badges close the loop so people actually come back.

## Out of scope for this phase

Saved for follow-ups so this stays shippable:
- Weekly auto-agenda generation (Rose)
- Async video/voice updates (Loom-style)
- Office-hours booking
- Parent digest / parent-specific surface
- Mobile-native student shell

## Technical notes

**Schema changes** (one migration):
- New table `activity_events` — `id, student_id, actor ('consultant'|'student'|'system'), kind, ref_table, ref_id, summary, payload jsonb, created_at`. Indexed on `(student_id, created_at desc)`. Added to `supabase_realtime` publication.
- New table `student_workspace_notes` — `student_id (pk), body text, updated_at, updated_by`. Realtime-enabled.
- New table `workspace_presence_state` — `student_id, side ('consultant'|'student'), last_seen_at`. Used for unread math.
- `student_messages` gets `consultant_read_at timestamptz`.
- All new tables: `GRANT` to authenticated + service_role, RLS enabled with permissive policies for now (auth is disabled in current phase per project memory) — tightened in Phase 2 when multi-tenant auth lands.

**Activity event emission**: triggers on `student_messages`, `student_documents_v2`, `student_document_versions`, `student_colleges`, `student_tasks`, `accepted_universities`, `student_calendar_events`, `student_documents` → INSERT into `activity_events` with a normalized summary.

**Realtime**:
- Subscribe to `activity_events` filtered by `student_id` on both consultant and student surfaces → push new events into the feed.
- Presence channel per student → "is viewing now" pill.
- `student_workspace_notes` subscription → shared notepad live sync.

**Components**:
- `ActivityFeed.tsx` — shared component, takes `studentId`, used in both consultant and student contexts with a `viewerSide` prop to color events appropriately.
- `WorkspacePresence.tsx` — presence pill.
- `SharedNotepad.tsx` — markdown textarea with debounced realtime save.
- `useUnreadActivity(studentId, side)` — hook returning `{ unreadCount, markSeen }`.
- WritingLab gains a `CommentLayer` that reads/writes `student_document_comments` keyed to character ranges.

**Files touched**:
- New: `src/components/workspace/ActivityFeed.tsx`, `WorkspacePresence.tsx`, `SharedNotepad.tsx`, `CommentLayer.tsx`; `src/hooks/useActivityFeed.ts`, `useUnreadActivity.ts`, `useWorkspacePresence.ts`, `useWorkspaceNotes.ts`.
- Edited: `src/pages/StudentJourney.tsx` (mount presence + feed + notes), `src/components/journey/JourneyHome.tsx` (What's new section), `src/components/journey/JourneyWritingLab.tsx` (comment layer), consultant student-detail page (Activity tab, presence, notes, unread), `src/components/layout/Sidebar.tsx` (badge).

## Demo story after build

Open the consultant view of a student → see "Student viewing now" pill light up. Student adds a college on their side → it appears in the consultant feed within a second. Consultant highlights a sentence in the essay, leaves a comment → student sees the comment on their next refresh and replies inline. Both sides edit the shared notepad simultaneously. Sidebar shows a "3" badge on Students for unread activity.