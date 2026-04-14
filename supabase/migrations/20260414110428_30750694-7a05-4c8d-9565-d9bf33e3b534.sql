
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'שיחה חדשה',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on ai_conversations" ON public.ai_conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_conversations" ON public.ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on ai_conversations" ON public.ai_conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on ai_conversations" ON public.ai_conversations FOR DELETE USING (true);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on ai_messages" ON public.ai_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_messages" ON public.ai_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on ai_messages" ON public.ai_messages FOR DELETE USING (true);

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
