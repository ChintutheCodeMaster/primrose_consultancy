-- =============================================================================
-- Port TPR's student↔consultant messaging into Noga
-- =============================================================================
-- Replaces the flat noga.student_messages log with TPR's two-table model:
--   noga.conversations — one row per student↔advisor thread
--   noga.messages      — individual messages, sender_id → auth.users(id)
--
-- Existing rows in noga.student_messages are dropped (user authorised — no
-- migration burden). The activity_events emit trigger is rewired to fire on
-- the new noga.messages table so the activity feed keeps working.
--
-- Parent dimension and attachments are intentionally skipped.
-- =============================================================================

-- ── 1. Drop old messaging surface ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_activity_message ON noga.student_messages;
DROP TABLE IF EXISTS noga.student_messages;

-- ── 2. Conversations table ───────────────────────────────────────────────────
CREATE TABLE noga.conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES noga.students(id) ON DELETE CASCADE,
  advisor_id  uuid NOT NULL REFERENCES noga.advisors(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'urgent', 'archived')),
  tags        text[],
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_student_id ON noga.conversations (student_id);
CREATE INDEX idx_conversations_advisor_id ON noga.conversations (advisor_id);
CREATE UNIQUE INDEX conversations_student_advisor_unique
  ON noga.conversations (student_id, advisor_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON noga.conversations
  FOR EACH ROW EXECUTE FUNCTION noga.update_updated_at_column();

ALTER TABLE noga.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on conversations"
  ON noga.conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on conversations"
  ON noga.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on conversations"
  ON noga.conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on conversations"
  ON noga.conversations FOR DELETE USING (true);

-- ── 3. Messages table ────────────────────────────────────────────────────────
CREATE TABLE noga.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES noga.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         text NOT NULL,
  read            boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON noga.messages (conversation_id, created_at);
CREATE INDEX idx_messages_unread ON noga.messages (conversation_id) WHERE read = false;

ALTER TABLE noga.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on messages"
  ON noga.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on messages"
  ON noga.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on messages"
  ON noga.messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on messages"
  ON noga.messages FOR DELETE USING (true);

-- ── 4. Realtime publication ──────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE noga.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE noga.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ── 5. Rewire emit_activity_message() onto noga.messages ─────────────────────
-- The trigger now joins to conversations to resolve student_id + actor role.
CREATE OR REPLACE FUNCTION noga.emit_activity_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
DECLARE
  conv         record;
  actor_label  text;
BEGIN
  SELECT student_id, advisor_id INTO conv
  FROM noga.conversations
  WHERE id = NEW.conversation_id;

  IF conv.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sender role lookup: advisor row first, then student
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM noga.advisors WHERE user_id = NEW.sender_id) THEN 'consultant'
    WHEN EXISTS (SELECT 1 FROM noga.students WHERE user_id = NEW.sender_id) THEN 'student'
    ELSE 'system'
  END INTO actor_label;

  INSERT INTO noga.activity_events (student_id, actor, kind, ref_table, ref_id, summary, payload)
  VALUES (
    conv.student_id,
    actor_label,
    'message',
    'messages',
    NEW.id,
    LEFT(NEW.content, 140),
    jsonb_build_object('conversation_id', NEW.conversation_id)
  );

  RETURN NEW;
END
$$;

CREATE TRIGGER trg_activity_message
  AFTER INSERT ON noga.messages
  FOR EACH ROW EXECUTE FUNCTION noga.emit_activity_message();
