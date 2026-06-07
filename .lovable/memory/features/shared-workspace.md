---
name: Shared Consultant↔Student Workspace
description: Real-time activity feed, shared notepad, presence pill across consultant and student surfaces
type: feature
---
Per-student shared workspace. Surfaces:
- Consultant: `/students/:id/workspace` (StudentWorkspace page) — opened via "Workspace" button on StudentRow.
- Student: ActivityFeed + SharedNotepad + WorkspacePresence rendered in JourneyHome.

Components: `src/components/workspace/{ActivityFeed,SharedNotepad,WorkspacePresence}.tsx`
Hooks: `src/hooks/{useActivityFeed,useWorkspaceNotes,useWorkspacePresence}.ts`

DB:
- `activity_events` (student_id, actor, kind, ref_table, ref_id, summary, payload) — written by triggers on student_messages, student_document_versions, student_document_comments, student_colleges, student_tasks (insert + complete), accepted_universities, student_calendar_events. Realtime publication enabled.
- `student_workspace_notes` (PK student_id, body, updated_by) — realtime, debounced upsert from SharedNotepad (~500ms).
- `workspace_presence_state` (student_id, side, last_seen_at) — written by useWorkspacePresence on subscribe.
- `student_messages.consultant_read_at` added.

Presence uses Supabase Realtime presence channel `presence:student:{id}` keyed by side ('consultant'|'student'); WorkspacePresence shows "<other> viewing now" when the other key is present.

RLS is permissive (auth disabled, Phase 1). Tighten in Phase 2.
