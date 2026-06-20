-- =============================================================================
-- Noga consolidated schema
-- Generated from 55 migrations spanning 2025-12-14 to 2026-06-07.
-- Target schema = noga (NOT public).
-- Intended for paste into the Supabase SQL editor of a fresh project that
-- already has TPR's tables in the public schema. Noga's objects all live in
-- the new `noga` schema so there are no collisions with TPR.
--
-- References to `auth.users`, `auth.uid()`, etc. are left untouched (these
-- live in Supabase's shared `auth` schema and are valid as-is).
-- Storage bucket / storage.objects policies from the original migrations are
-- OMITTED — the target project's storage schema is shared and adding buckets
-- and storage policies is best done in the Supabase Storage UI manually.
-- Realtime publication ALTERs are also OMITTED — re-enable in the dashboard.
-- =============================================================================

-- === Schema ===
CREATE SCHEMA IF NOT EXISTS noga;

-- === Extensions ===
-- gen_random_uuid() is used pervasively as the PK default.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- === Tables ===
-- Final-state DDL (column additions/drops/type changes from later migrations
-- already folded in). FKs are added at the bottom of this file to keep table
-- creation order-independent.
-- =============================================================================

-- ---- accepted_universities -------------------------------------------------
CREATE TABLE noga.accepted_universities (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id             uuid NOT NULL,
  name                   text NOT NULL,
  acceptance_letter_url  text,
  country                text,
  degree_type            text,
  degree_type_other      text,
  field                  text,
  study_year             text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- ---- activity_events -------------------------------------------------------
CREATE TABLE noga.activity_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL,
  actor       text NOT NULL DEFAULT 'system',
  kind        text NOT NULL,
  ref_table   text,
  ref_id      uuid,
  summary     text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- advisors -------------------------------------------------------------
CREATE TABLE noga.advisors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text,
  phone             text,
  payment_type      text DEFAULT 'per_package',
  payment_amount    numeric DEFAULT 0,
  payment_notes     text,
  contract_url      text,
  notes             text,
  is_active         boolean DEFAULT true,
  portal_password   text DEFAULT NULL,
  residence         text DEFAULT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---- agreement_templates --------------------------------------------------
-- Created out-of-band (no CREATE TABLE migration; reconstructed from
-- ALTERs and the generated supabase types.ts).
CREATE TABLE noga.agreement_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  content     text NOT NULL,
  type        text DEFAULT 'package',
  is_active   boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- ai_conversations -----------------------------------------------------
CREATE TABLE noga.ai_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL DEFAULT 'שיחה חדשה',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- ai_messages ----------------------------------------------------------
CREATE TABLE noga.ai_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL,
  role             text NOT NULL,
  content          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---- applied_universities --------------------------------------------------
CREATE TABLE noga.applied_universities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  name                text NOT NULL,
  country             text,
  degree_type         text,
  degree_type_other   text,
  field               text,
  study_year          text,
  application_status  text DEFAULT 'submitted',
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- benchmark_percentiles ------------------------------------------------
CREATE TABLE noga.benchmark_percentiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric       text NOT NULL,
  period       text NOT NULL,
  p25          numeric,
  p50          numeric,
  p75          numeric,
  sample_size  integer NOT NULL DEFAULT 0,
  computed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric, period)
);

-- ---- collaborations -------------------------------------------------------
CREATE TABLE noga.collaborations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  contact_name   text,
  contact_phone  text,
  contact_email  text,
  category       text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- college_reference ----------------------------------------------------
CREATE TABLE noga.college_reference (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL UNIQUE,
  city                text,
  state               text,
  acceptance_rate     numeric,
  median_sat          integer,
  median_act          integer,
  size                integer,
  setting             text,
  is_test_optional    boolean DEFAULT false,
  is_common_app       boolean DEFAULT true,
  ranking_tier        text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- country_options ------------------------------------------------------
CREATE TABLE noga.country_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- field_options --------------------------------------------------------
CREATE TABLE noga.field_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- leads ----------------------------------------------------------------
CREATE TABLE noga.leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  email               text,
  phone               text,
  source              text,
  status              text NOT NULL DEFAULT 'new',
  degree_type         text NOT NULL DEFAULT 'bachelor',
  interested_country  text,
  interested_field    text,
  meeting_summary     text,
  did_not_continue    boolean DEFAULT false,
  package_notes       text DEFAULT NULL,
  leads_year          text,
  advisor_name        text,
  discontinue_reason  text,
  website_inquiry     text DEFAULT NULL,
  is_from_website     boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_contact_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- leads_year_settings --------------------------------------------------
CREATE TABLE noga.leads_year_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_year     text NOT NULL,
  next_year        text NOT NULL,
  transition_date  date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---- org_benchmark_settings -----------------------------------------------
CREATE TABLE noga.org_benchmark_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid,
  opted_in          boolean NOT NULL DEFAULT false,
  last_computed_at  timestamptz,
  metrics           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---- outcomes_share_tokens ------------------------------------------------
CREATE TABLE noga.outcomes_share_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token        text NOT NULL UNIQUE,
  cohort_year  integer NOT NULL,
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       text NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---- projects -------------------------------------------------------------
CREATE TABLE noga.projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  description           text,
  payment_direction     text NOT NULL DEFAULT 'income',
  amount                numeric DEFAULT 0,
  payment_date          date,
  invoice_date          date,
  status                text NOT NULL DEFAULT 'active',
  contact_name          text,
  contact_phone         text,
  contact_email         text,
  category              text,
  file_url              text,
  notes                 text,
  collaboration_id      uuid,
  payment_notes         text,
  storage_bucket        text DEFAULT NULL,
  storage_path          text DEFAULT NULL,
  payment_request_date  date,
  net_amount            numeric,
  currency              text NOT NULL DEFAULT 'ILS',
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ---- scholarship_options --------------------------------------------------
CREATE TABLE noga.scholarship_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- sidebar_categories ---------------------------------------------------
CREATE TABLE noga.sidebar_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_type  text NOT NULL,
  year_value     text NOT NULL,
  display_label  text NOT NULL,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- source_options -------------------------------------------------------
CREATE TABLE noga.source_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- student_agreements ---------------------------------------------------
CREATE TABLE noga.student_agreements (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id               uuid NOT NULL,
  first_name               text NOT NULL,
  last_name                text NOT NULL,
  birth_date               date NOT NULL,
  email                    text NOT NULL,
  phone                    text NOT NULL,
  id_number                text NOT NULL,
  address                  text NOT NULL,
  signed_at                timestamptz NOT NULL DEFAULT now(),
  ip_address               text,
  user_agent               text,
  notification_dismissed   boolean DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_agreement UNIQUE (student_id)
);

-- ---- student_ai_sessions --------------------------------------------------
CREATE TABLE noga.student_ai_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL,
  mode         text NOT NULL,
  input_text   text,
  output_json  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---- student_calendar_events ----------------------------------------------
CREATE TABLE noga.student_calendar_events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id               uuid NOT NULL,
  title                    text NOT NULL,
  description              text,
  location                 text,
  start_at                 timestamptz NOT NULL,
  end_at                   timestamptz,
  all_day                  boolean NOT NULL DEFAULT false,
  reminder_minutes_before  integer,
  event_type               text NOT NULL DEFAULT 'meeting',
  created_by               text NOT NULL DEFAULT 'consultant',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ---- student_checklist_items ----------------------------------------------
CREATE TABLE noga.student_checklist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL,
  title         text NOT NULL,
  description   text,
  is_completed  boolean DEFAULT false,
  due_date      date,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- student_colleges -----------------------------------------------------
CREATE TABLE noga.student_colleges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  college_name        text NOT NULL,
  country             text,
  list_bucket         text NOT NULL DEFAULT 'target',
  application_plan    text,
  deadline            date,
  status              text NOT NULL DEFAULT 'researching',
  submitted_at        date,
  decision_at         date,
  portal_url          text,
  application_id      text,
  scholarship_amount  numeric,
  notes               text,
  sort_order          integer NOT NULL DEFAULT 0,
  locked_at           timestamptz,
  essays_status       text DEFAULT 'not_started',
  recs_status         text DEFAULT 'not_started',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- student_conversations ------------------------------------------------
CREATE TABLE noga.student_conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  advisor_id          uuid,
  conversation_date   timestamptz NOT NULL DEFAULT now(),
  summary             text NOT NULL,
  follow_up_actions   text,
  created_by          text NOT NULL DEFAULT 'advisor',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- student_document_comments --------------------------------------------
CREATE TABLE noga.student_document_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id    uuid NOT NULL,
  anchor_start  integer,
  anchor_end    integer,
  author        text NOT NULL,
  body          text NOT NULL,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- student_document_versions --------------------------------------------
CREATE TABLE noga.student_document_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid NOT NULL,
  version_no   integer NOT NULL DEFAULT 1,
  body_text    text,
  file_url     text,
  file_mime    text,
  word_count   integer,
  status       text NOT NULL DEFAULT 'draft',
  created_by   text NOT NULL DEFAULT 'student',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---- student_documents (v1; v2 was added later but v1 was not dropped) ----
CREATE TABLE noga.student_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL,
  name         text NOT NULL,
  description  text,
  file_url     text NOT NULL,
  category     text DEFAULT 'general',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---- student_documents_v2 -------------------------------------------------
CREATE TABLE noga.student_documents_v2 (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL,
  title           text NOT NULL,
  kind            text NOT NULL DEFAULT 'essay',
  prompt_text     text,
  status          text NOT NULL DEFAULT 'draft',
  folder          text DEFAULT 'other',
  review_status   text DEFAULT 'none',
  requested_by    text,
  file_path       text,
  uploaded_by     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- student_messages -----------------------------------------------------
CREATE TABLE noga.student_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  author              text NOT NULL,
  body                text NOT NULL,
  attachment_url      text,
  attachment_path     text,
  read_at             timestamptz,
  cc_parent           boolean DEFAULT false,
  consultant_read_at  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- student_portal_tokens ------------------------------------------------
CREATE TABLE noga.student_portal_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL,
  token         text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'active',
  expires_at    timestamptz,
  last_seen_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- student_profile_extras -----------------------------------------------
CREATE TABLE noga.student_profile_extras (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL UNIQUE,
  graduation_year   text,
  intended_majors   text[] NOT NULL DEFAULT '{}',
  gpa               numeric,
  gpa_scale         numeric DEFAULT 4.0,
  sat_score         integer,
  act_score         integer,
  toefl_score       integer,
  ielts_score       numeric,
  duolingo_score    integer,
  extracurriculars  text,
  hooks             text,
  notes             text,
  onboarded_at      timestamptz,
  counselor_notes   text,
  parent_name       text,
  parent_email      text,
  parent_phone      text,
  activities        jsonb DEFAULT '[]'::jsonb,
  awards            jsonb DEFAULT '[]'::jsonb,
  career_goals      text,
  about_me          text,
  current_school    text,
  class_rank        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---- student_scholarships -------------------------------------------------
CREATE TABLE noga.student_scholarships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL,
  name        text NOT NULL,
  amount      text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- student_strategy_reviews ---------------------------------------------
CREATE TABLE noga.student_strategy_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL,
  mode            text NOT NULL DEFAULT 'fast',
  input_snapshot  jsonb NOT NULL,
  output_json     jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- student_tasks --------------------------------------------------------
CREATE TABLE noga.student_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL,
  title         text NOT NULL,
  description   text,
  due_date      date,
  status        text NOT NULL DEFAULT 'todo',
  link_url      text,
  created_by    text NOT NULL DEFAULT 'consultant',
  sort_order    integer NOT NULL DEFAULT 0,
  template_key  text,
  college_id    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- student_workspace_notes ----------------------------------------------
CREATE TABLE noga.student_workspace_notes (
  student_id  uuid PRIMARY KEY,
  body        text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

-- ---- students -------------------------------------------------------------
CREATE TABLE noga.students (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                            text NOT NULL,
  email                           text,
  phone                           text,
  status                          text NOT NULL DEFAULT 'active',
  degree_type                     text NOT NULL DEFAULT 'bachelor',
  interested_country              text,
  interested_field                text,
  source                          text,
  meeting_summary                 text,
  package_cost                    numeric DEFAULT 0,
  advisor_name                    text,
  is_paid                         boolean DEFAULT false,
  target_country                  text,
  target_university               text,
  program                         text,
  start_date                      timestamptz,
  graduation_year                 text,
  signed_agreement                boolean DEFAULT false,
  agreement_reminder_date         timestamptz,
  payment_notes                   text,
  advisor_id                      uuid,
  dismissed_from_attention        boolean DEFAULT false,
  amount_paid                     numeric DEFAULT 0,
  did_not_continue                boolean DEFAULT false,
  package_notes                   text DEFAULT NULL,
  payment_type                    text DEFAULT 'package',
  payment_reminder_date           date,
  payment_date                    date,
  discontinue_reason              text,
  advisor_payment_notes           text,
  follow_up_reminder_date         date,
  follow_up_reminder_note         text,
  follow_up_reminder_dismissed    boolean DEFAULT false,
  website_inquiry                 text,
  is_from_website                 boolean DEFAULT false,
  phase                           text DEFAULT 'discovery',
  preferred_name                  text,
  created_at                      timestamptz NOT NULL DEFAULT now()
);

-- ---- target_university_options --------------------------------------------
CREATE TABLE noga.target_university_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- workspace_presence_state ---------------------------------------------
CREATE TABLE noga.workspace_presence_state (
  student_id    uuid NOT NULL,
  side          text NOT NULL,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, side)
);


-- =============================================================================
-- === Indexes ===
-- =============================================================================
CREATE INDEX idx_student_conversations_student_id
  ON noga.student_conversations(student_id);
CREATE INDEX idx_student_conversations_advisor_id
  ON noga.student_conversations(advisor_id);

CREATE INDEX student_colleges_student_id_idx
  ON noga.student_colleges(student_id);
CREATE INDEX student_colleges_deadline_idx
  ON noga.student_colleges(deadline);

CREATE INDEX strategy_reviews_student_idx
  ON noga.student_strategy_reviews(student_id, created_at DESC);

CREATE INDEX student_calendar_events_student_idx
  ON noga.student_calendar_events(student_id);
CREATE INDEX student_calendar_events_start_idx
  ON noga.student_calendar_events(start_at);

CREATE INDEX activity_events_student_created_idx
  ON noga.activity_events (student_id, created_at DESC);


-- =============================================================================
-- === Functions ===
-- All functions are namespaced under `noga.`. Body references to Noga tables
-- are prefixed with `noga.`. SET search_path is updated to noga, public.
-- =============================================================================

-- Generic updated_at touch — used as trigger fn for many tables
CREATE OR REPLACE FUNCTION noga.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION noga.emit_activity_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    NEW.student_id,
    COALESCE(NEW.author, 'system'),
    'message',
    'student_messages',
    NEW.id,
    LEFT(NEW.body, 140),
    jsonb_build_object('hasAttachment', NEW.attachment_url IS NOT NULL)
  );
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION noga.emit_activity_essay_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
DECLARE doc record;
BEGIN
  SELECT student_id, title INTO doc FROM noga.student_documents_v2 WHERE id = NEW.document_id;
  IF doc.student_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    doc.student_id,
    COALESCE(NEW.created_by, 'system'),
    'essay_version',
    'student_document_versions',
    NEW.id,
    'New version of "' || COALESCE(doc.title, 'document') || '"',
    jsonb_build_object('documentId', NEW.document_id, 'title', doc.title)
  );
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION noga.emit_activity_essay_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
DECLARE sid uuid; ttitle text;
BEGIN
  SELECT d.student_id, d.title INTO sid, ttitle
  FROM noga.student_document_versions v
  JOIN noga.student_documents_v2 d ON d.id = v.document_id
  WHERE v.id = NEW.version_id;
  IF sid IS NULL THEN RETURN NEW; END IF;
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    sid,
    COALESCE(NEW.author, 'system'),
    'comment',
    'student_document_comments',
    NEW.id,
    'Comment on "' || COALESCE(ttitle, 'document') || '": ' || LEFT(NEW.body, 100),
    jsonb_build_object('versionId', NEW.version_id, 'title', ttitle)
  );
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION noga.emit_activity_college()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    NEW.student_id, 'system', 'college', 'student_colleges', NEW.id,
    'Added ' || COALESCE(NEW.college_name, 'a college') || ' to college list',
    jsonb_build_object('collegeName', NEW.college_name)
  );
  RETURN NEW;
END
$$;

-- Fixed during consolidation: original migration referenced NEW.completed /
-- OLD.completed but student_tasks uses a `status` text column (values: 'todo',
-- 'done', etc. — completion === status = 'done'). Rewritten to read `status`.
CREATE OR REPLACE FUNCTION noga.emit_activity_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
    VALUES (NEW.student_id, 'system', 'task', 'student_tasks', NEW.id,
      'New task: ' || COALESCE(NEW.title, 'Untitled'),
      jsonb_build_object('completed', NEW.status = 'done'));
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') <> 'done' AND NEW.status = 'done' THEN
    INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
    VALUES (NEW.student_id, 'system', 'task', 'student_tasks', NEW.id,
      'Completed task: ' || COALESCE(NEW.title, 'Untitled'),
      jsonb_build_object('completed', true));
  END IF;
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION noga.emit_activity_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (NEW.student_id, 'system', 'acceptance', 'accepted_universities', NEW.id,
    'Acceptance: ' || COALESCE(NEW.name, 'University'),
    jsonb_build_object('university', NEW.name));
  RETURN NEW;
END
$$;

-- Fixed during consolidation: original migration referenced NEW.starts_at but
-- student_calendar_events column is `start_at`. Rewritten to use the real name.
CREATE OR REPLACE FUNCTION noga.emit_activity_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (NEW.student_id, 'system', 'calendar', 'student_calendar_events', NEW.id,
    COALESCE(NEW.title, 'Event') || ' scheduled',
    jsonb_build_object('title', NEW.title, 'startAt', NEW.start_at));
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION noga.touch_workspace_notes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = noga, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;


-- =============================================================================
-- === Triggers ===
-- =============================================================================
CREATE TRIGGER update_student_checklist_items_updated_at
  BEFORE UPDATE ON noga.student_checklist_items
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON noga.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER update_student_colleges_updated_at
  BEFORE UPDATE ON noga.student_colleges
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER update_student_profile_extras_updated_at
  BEFORE UPDATE ON noga.student_profile_extras
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER trg_portal_tokens_updated
  BEFORE UPDATE ON noga.student_portal_tokens
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER trg_student_tasks_updated
  BEFORE UPDATE ON noga.student_tasks
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER trg_docs_v2_updated
  BEFORE UPDATE ON noga.student_documents_v2
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER update_org_benchmark_settings_updated_at
  BEFORE UPDATE ON noga.org_benchmark_settings
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER trg_student_calendar_events_updated
  BEFORE UPDATE ON noga.student_calendar_events
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

CREATE TRIGGER trg_activity_message
  AFTER INSERT ON noga.student_messages
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_message();

CREATE TRIGGER trg_activity_essay_version
  AFTER INSERT ON noga.student_document_versions
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_essay_version();

CREATE TRIGGER trg_activity_essay_comment
  AFTER INSERT ON noga.student_document_comments
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_essay_comment();

CREATE TRIGGER trg_activity_college
  AFTER INSERT ON noga.student_colleges
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_college();

CREATE TRIGGER trg_activity_task
  AFTER INSERT OR UPDATE ON noga.student_tasks
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_task();

CREATE TRIGGER trg_activity_acceptance
  AFTER INSERT ON noga.accepted_universities
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_acceptance();

CREATE TRIGGER trg_activity_calendar
  AFTER INSERT ON noga.student_calendar_events
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_calendar();

CREATE TRIGGER trg_touch_workspace_notes
  BEFORE UPDATE ON noga.student_workspace_notes
  FOR EACH ROW EXECUTE FUNCTION noga.touch_workspace_notes();


-- =============================================================================
-- === RLS ENABLE ===
-- =============================================================================
ALTER TABLE noga.accepted_universities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.activity_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.advisors                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.ai_conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.ai_messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.applied_universities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.benchmark_percentiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.collaborations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.college_reference           ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.country_options             ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.field_options               ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.leads                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.leads_year_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.org_benchmark_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.outcomes_share_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.projects                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.scholarship_options         ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.sidebar_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.source_options              ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_agreements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_ai_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_calendar_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_checklist_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_colleges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_document_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_document_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_documents_v2        ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_portal_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_profile_extras      ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_scholarships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_strategy_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.student_workspace_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.students                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.target_university_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE noga.workspace_presence_state    ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- === Policies ===
-- All migration policies are "public access" wrappers (USING true /
-- WITH CHECK true). Carried over verbatim under the noga schema.
-- WARNING: every policy below grants full anon read/write — this is the
-- existing Noga security posture, NOT a hardening pass. Review before
-- production use.
-- =============================================================================

-- leads
CREATE POLICY "Allow public read on leads"   ON noga.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leads" ON noga.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on leads" ON noga.leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on leads" ON noga.leads FOR DELETE USING (true);

-- students
CREATE POLICY "Allow public read on students"   ON noga.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert on students" ON noga.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on students" ON noga.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on students" ON noga.students FOR DELETE USING (true);

-- accepted_universities
CREATE POLICY "Allow public read on accepted_universities"   ON noga.accepted_universities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on accepted_universities" ON noga.accepted_universities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on accepted_universities" ON noga.accepted_universities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on accepted_universities" ON noga.accepted_universities FOR DELETE USING (true);

-- advisors
CREATE POLICY "Allow public read on advisors"   ON noga.advisors FOR SELECT USING (true);
CREATE POLICY "Allow public insert on advisors" ON noga.advisors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on advisors" ON noga.advisors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on advisors" ON noga.advisors FOR DELETE USING (true);

-- student_agreements
CREATE POLICY "Allow public insert on student_agreements" ON noga.student_agreements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on student_agreements"   ON noga.student_agreements FOR SELECT USING (true);
CREATE POLICY "Allow public delete on student_agreements" ON noga.student_agreements FOR DELETE USING (true);
CREATE POLICY "Allow public update on student_agreements" ON noga.student_agreements FOR UPDATE USING (true);

-- student_checklist_items
CREATE POLICY "Allow public read on student_checklist_items"   ON noga.student_checklist_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_checklist_items" ON noga.student_checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_checklist_items" ON noga.student_checklist_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_checklist_items" ON noga.student_checklist_items FOR DELETE USING (true);

-- student_documents
CREATE POLICY "Allow public read on student_documents"   ON noga.student_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_documents" ON noga.student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_documents" ON noga.student_documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_documents" ON noga.student_documents FOR DELETE USING (true);

-- student_conversations
CREATE POLICY "Allow public read on student_conversations"   ON noga.student_conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_conversations" ON noga.student_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_conversations" ON noga.student_conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_conversations" ON noga.student_conversations FOR DELETE USING (true);

-- sidebar_categories
CREATE POLICY "Allow public read on sidebar_categories"   ON noga.sidebar_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sidebar_categories" ON noga.sidebar_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sidebar_categories" ON noga.sidebar_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sidebar_categories" ON noga.sidebar_categories FOR DELETE USING (true);

-- source_options
CREATE POLICY "Allow public read on source_options"   ON noga.source_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert on source_options" ON noga.source_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on source_options" ON noga.source_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on source_options" ON noga.source_options FOR DELETE USING (true);

-- country_options
CREATE POLICY "Allow public read on country_options"   ON noga.country_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert on country_options" ON noga.country_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on country_options" ON noga.country_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on country_options" ON noga.country_options FOR DELETE USING (true);

-- projects
CREATE POLICY "Allow public read on projects"   ON noga.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert on projects" ON noga.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on projects" ON noga.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on projects" ON noga.projects FOR DELETE USING (true);

-- collaborations
CREATE POLICY "Allow public read on collaborations"   ON noga.collaborations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collaborations" ON noga.collaborations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collaborations" ON noga.collaborations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on collaborations" ON noga.collaborations FOR DELETE USING (true);

-- target_university_options
CREATE POLICY "Allow public read on target_university_options"   ON noga.target_university_options FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on target_university_options" ON noga.target_university_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on target_university_options" ON noga.target_university_options FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on target_university_options" ON noga.target_university_options FOR DELETE TO public USING (true);

-- scholarship_options
CREATE POLICY "Allow public read on scholarship_options"   ON noga.scholarship_options FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on scholarship_options" ON noga.scholarship_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on scholarship_options" ON noga.scholarship_options FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on scholarship_options" ON noga.scholarship_options FOR DELETE TO public USING (true);

-- student_scholarships
CREATE POLICY "Allow public read on student_scholarships"   ON noga.student_scholarships FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on student_scholarships" ON noga.student_scholarships FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on student_scholarships" ON noga.student_scholarships FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on student_scholarships" ON noga.student_scholarships FOR DELETE TO public USING (true);

-- leads_year_settings
CREATE POLICY "Allow public read on leads_year_settings"   ON noga.leads_year_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update on leads_year_settings" ON noga.leads_year_settings FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public insert on leads_year_settings" ON noga.leads_year_settings FOR INSERT TO public WITH CHECK (true);

-- ai_conversations
CREATE POLICY "Allow public select on ai_conversations" ON noga.ai_conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_conversations" ON noga.ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on ai_conversations" ON noga.ai_conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on ai_conversations" ON noga.ai_conversations FOR DELETE USING (true);

-- ai_messages
CREATE POLICY "Allow public select on ai_messages" ON noga.ai_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_messages" ON noga.ai_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on ai_messages" ON noga.ai_messages FOR DELETE USING (true);

-- applied_universities
CREATE POLICY "Allow public read on applied_universities"   ON noga.applied_universities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on applied_universities" ON noga.applied_universities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on applied_universities" ON noga.applied_universities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on applied_universities" ON noga.applied_universities FOR DELETE USING (true);

-- field_options
CREATE POLICY "Allow public read on field_options"   ON noga.field_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert on field_options" ON noga.field_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on field_options" ON noga.field_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on field_options" ON noga.field_options FOR DELETE USING (true);

-- student_colleges
CREATE POLICY "Allow public read on student_colleges"   ON noga.student_colleges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_colleges" ON noga.student_colleges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_colleges" ON noga.student_colleges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_colleges" ON noga.student_colleges FOR DELETE USING (true);

-- student_profile_extras
CREATE POLICY "Allow public read on student_profile_extras"   ON noga.student_profile_extras FOR SELECT USING (true);
CREATE POLICY "Allow public insert on student_profile_extras" ON noga.student_profile_extras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on student_profile_extras" ON noga.student_profile_extras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on student_profile_extras" ON noga.student_profile_extras FOR DELETE USING (true);

-- student_portal_tokens
CREATE POLICY "Allow public access" ON noga.student_portal_tokens FOR ALL USING (true) WITH CHECK (true);

-- student_tasks
CREATE POLICY "Allow public access" ON noga.student_tasks FOR ALL USING (true) WITH CHECK (true);

-- student_messages
CREATE POLICY "Allow public access" ON noga.student_messages FOR ALL USING (true) WITH CHECK (true);

-- student_documents_v2
CREATE POLICY "Allow public access" ON noga.student_documents_v2 FOR ALL USING (true) WITH CHECK (true);

-- student_document_versions
CREATE POLICY "Allow public access" ON noga.student_document_versions FOR ALL USING (true) WITH CHECK (true);

-- student_document_comments
CREATE POLICY "Allow public access" ON noga.student_document_comments FOR ALL USING (true) WITH CHECK (true);

-- student_ai_sessions
CREATE POLICY "Allow public access" ON noga.student_ai_sessions FOR ALL USING (true) WITH CHECK (true);

-- college_reference
CREATE POLICY "Public read college_reference" ON noga.college_reference FOR SELECT USING (true);

-- student_strategy_reviews
CREATE POLICY "Open access strategy reviews" ON noga.student_strategy_reviews FOR ALL USING (true) WITH CHECK (true);

-- outcomes_share_tokens
CREATE POLICY "Public read outcomes tokens" ON noga.outcomes_share_tokens FOR SELECT USING (true);
CREATE POLICY "Open write outcomes tokens" ON noga.outcomes_share_tokens FOR ALL USING (true) WITH CHECK (true);

-- org_benchmark_settings
CREATE POLICY "Open access benchmark settings" ON noga.org_benchmark_settings FOR ALL USING (true) WITH CHECK (true);

-- benchmark_percentiles
CREATE POLICY "Public read percentiles" ON noga.benchmark_percentiles FOR SELECT USING (true);

-- student_calendar_events
CREATE POLICY "Allow public access" ON noga.student_calendar_events USING (true) WITH CHECK (true);

-- activity_events
CREATE POLICY "Open access activity_events" ON noga.activity_events FOR ALL USING (true) WITH CHECK (true);

-- student_workspace_notes
CREATE POLICY "Open access workspace_notes" ON noga.student_workspace_notes FOR ALL USING (true) WITH CHECK (true);

-- workspace_presence_state
CREATE POLICY "Open access presence" ON noga.workspace_presence_state FOR ALL USING (true) WITH CHECK (true);


-- =============================================================================
-- === Foreign keys ===
-- Added at the end so table-creation order does not matter.
-- =============================================================================
ALTER TABLE noga.accepted_universities
  ADD CONSTRAINT accepted_universities_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.activity_events
  ADD CONSTRAINT activity_events_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.ai_messages
  ADD CONSTRAINT ai_messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES noga.ai_conversations(id) ON DELETE CASCADE;

ALTER TABLE noga.applied_universities
  ADD CONSTRAINT applied_universities_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.projects
  ADD CONSTRAINT projects_collaboration_id_fkey
  FOREIGN KEY (collaboration_id) REFERENCES noga.collaborations(id) ON DELETE CASCADE;

ALTER TABLE noga.student_agreements
  ADD CONSTRAINT student_agreements_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_ai_sessions
  ADD CONSTRAINT student_ai_sessions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_calendar_events
  ADD CONSTRAINT student_calendar_events_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_checklist_items
  ADD CONSTRAINT student_checklist_items_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_colleges
  ADD CONSTRAINT student_colleges_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_conversations
  ADD CONSTRAINT student_conversations_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;
ALTER TABLE noga.student_conversations
  ADD CONSTRAINT student_conversations_advisor_id_fkey
  FOREIGN KEY (advisor_id) REFERENCES noga.advisors(id) ON DELETE SET NULL;

ALTER TABLE noga.student_document_comments
  ADD CONSTRAINT student_document_comments_version_id_fkey
  FOREIGN KEY (version_id) REFERENCES noga.student_document_versions(id) ON DELETE CASCADE;

ALTER TABLE noga.student_document_versions
  ADD CONSTRAINT student_document_versions_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES noga.student_documents_v2(id) ON DELETE CASCADE;

ALTER TABLE noga.student_documents
  ADD CONSTRAINT student_documents_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_documents_v2
  ADD CONSTRAINT student_documents_v2_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_messages
  ADD CONSTRAINT student_messages_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_portal_tokens
  ADD CONSTRAINT student_portal_tokens_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_profile_extras
  ADD CONSTRAINT student_profile_extras_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_scholarships
  ADD CONSTRAINT student_scholarships_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_strategy_reviews
  ADD CONSTRAINT student_strategy_reviews_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.student_tasks
  ADD CONSTRAINT student_tasks_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;
ALTER TABLE noga.student_tasks
  ADD CONSTRAINT student_tasks_college_id_fkey
  FOREIGN KEY (college_id) REFERENCES noga.student_colleges(id) ON DELETE SET NULL;

ALTER TABLE noga.student_workspace_notes
  ADD CONSTRAINT student_workspace_notes_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;

ALTER TABLE noga.students
  ADD CONSTRAINT students_advisor_id_fkey
  FOREIGN KEY (advisor_id) REFERENCES noga.advisors(id);

ALTER TABLE noga.workspace_presence_state
  ADD CONSTRAINT workspace_presence_state_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES noga.students(id) ON DELETE CASCADE;


-- =============================================================================
-- === Seed data ===
-- Reference / dropdown seed rows from the migrations. Idempotent where
-- the original used ON CONFLICT / NOT EXISTS; otherwise plain INSERTs.
-- =============================================================================

-- sidebar_categories
INSERT INTO noga.sidebar_categories (category_type, year_value, display_label, sort_order) VALUES
  ('leads', '27', 'מתעניינים 27', 1),
  ('leads', '26', 'מתעניינים 26', 2),
  ('leads', '25', 'מתעניינים 25', 3),
  ('leads', '24', 'מתעניינים 24', 4),
  ('leads', '23', 'מתעניינים 23', 5),
  ('past_clients', '2026', 'לקוחות עבר 2026', 1),
  ('past_clients', '2025', 'לקוחות עבר 2025', 2),
  ('past_clients', '2024', 'לקוחות עבר 2024', 3),
  ('past_clients', '2023', 'לקוחות עבר 2023', 4),
  ('past_clients', '2021-22', 'לקוחות עבר 2021-22', 5),
  ('did_not_continue', '2025-ומטה', '2025 ומטה', 1),
  ('did_not_continue', '2026', '2026', 2),
  ('did_not_continue', '2027', '2027', 3),
  ('did_not_continue', '2028', '2028', 4);

-- source_options
INSERT INTO noga.source_options (name, is_active, sort_order) VALUES
  ('לינקדאין', true, 1),
  ('פייסבוק', true, 2),
  ('גוגל', true, 3),
  ('פודקאסט', true, 4),
  ('המלצה ממועמד עבר', true, 5),
  ('קהילת לימודים באנגליה', true, 6),
  ('אינסטגרם', true, 7);

-- country_options
INSERT INTO noga.country_options (name, is_active, sort_order) VALUES
  ('אנגליה', true, 1),
  ('ארה״ב', true, 2),
  ('קנדה', true, 3),
  ('הולנד', true, 4),
  ('גרמניה', true, 5),
  ('אוסטרליה', true, 6);

-- target_university_options
INSERT INTO noga.target_university_options (name, sort_order) VALUES
  ('Harvard University', 1),
  ('Yale University', 2),
  ('Princeton University', 3),
  ('Columbia University', 4),
  ('University of Pennsylvania', 5),
  ('Cornell University', 6),
  ('Brown University', 7),
  ('Dartmouth College', 8),
  ('Massachusetts Institute of Technology', 9),
  ('Stanford University', 10),
  ('University of Chicago', 11),
  ('California Institute of Technology', 12),
  ('University of California, Berkeley', 13),
  ('University of Michigan', 14),
  ('University of Oxford', 15),
  ('University of Cambridge', 16),
  ('Imperial College London', 17),
  ('University College London', 18),
  ('London School of Economics', 19),
  ('King''s College London', 20),
  ('University of Edinburgh', 21),
  ('INSEAD', 22),
  ('Sciences Po', 23),
  ('Sorbonne University', 24);

-- scholarship_options
INSERT INTO noga.scholarship_options (name, sort_order) VALUES
  ('צ''בנינג', 1),
  ('פולברייט', 2),
  ('פישמן', 3),
  ('רודס', 4),
  ('ILF', 5);

-- field_options
INSERT INTO noga.field_options (name, sort_order) VALUES
  ('LLM', 1),
  ('MBA', 2),
  ('INTERNATIONAL RELATIONS', 3),
  ('NEUROSCIENCE', 4),
  ('BACHELORS GENERAL', 5),
  ('MASTERS GENERAL', 6),
  ('REAL ESTATE', 7),
  ('ARTS', 8),
  ('FINANCE', 9),
  ('COMPUTER SCIENCE', 10),
  ('PSYCHOLOGY', 11),
  ('ARCHITECTURE', 12),
  ('PHD / DOCTORAL PROGRAMS', 13),
  ('אחר', 99)
ON CONFLICT (name) DO NOTHING;

-- leads_year_settings (single config row)
INSERT INTO noga.leads_year_settings (current_year, next_year, transition_date)
VALUES ('27', '28', '2027-09-01');

-- agreement_templates seed (Hebrew default content)
INSERT INTO noga.agreement_templates (name, content, type, is_active)
  VALUES ('הסכם חבילה', 'תוכן הסכם חבילה - לערוך לפי הצורך', 'package', true);
INSERT INTO noga.agreement_templates (name, content, type, is_active)
  VALUES ('הסכם שעתי', 'תוכן הסכם שעתי - לערוך לפי הצורך', 'hourly', true);
INSERT INTO noga.agreement_templates (name, content, type, is_active)
  VALUES ('הסכם לערוך', 'תוכן הסכם לערוך - לערוך לפי הצורך', 'edit', true);

-- =============================================================================
-- End of consolidated Noga schema.
-- =============================================================================
