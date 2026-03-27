CREATE TABLE public.leads_year_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_year text NOT NULL,
  next_year text NOT NULL,
  transition_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_year_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on leads_year_settings" ON public.leads_year_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update on leads_year_settings" ON public.leads_year_settings FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public insert on leads_year_settings" ON public.leads_year_settings FOR INSERT TO public WITH CHECK (true);

INSERT INTO public.leads_year_settings (current_year, next_year, transition_date)
VALUES ('27', '28', '2027-09-01');