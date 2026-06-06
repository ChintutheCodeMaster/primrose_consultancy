CREATE TABLE public.student_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  reminder_minutes_before integer,
  event_type text NOT NULL DEFAULT 'meeting',
  created_by text NOT NULL DEFAULT 'consultant',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_calendar_events_student_idx ON public.student_calendar_events(student_id);
CREATE INDEX student_calendar_events_start_idx ON public.student_calendar_events(start_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_calendar_events TO anon, authenticated;
GRANT ALL ON public.student_calendar_events TO service_role;

ALTER TABLE public.student_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON public.student_calendar_events
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_student_calendar_events_updated
  BEFORE UPDATE ON public.student_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.student_calendar_events;