
-- 1. College reference (seeded list for Strategist)
CREATE TABLE public.college_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  city text,
  state text,
  acceptance_rate numeric,
  median_sat integer,
  median_act integer,
  size integer,
  setting text,
  is_test_optional boolean DEFAULT false,
  is_common_app boolean DEFAULT true,
  ranking_tier text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.college_reference TO anon, authenticated;
GRANT ALL ON public.college_reference TO service_role;
ALTER TABLE public.college_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read college_reference" ON public.college_reference FOR SELECT USING (true);

-- 2. Strategy reviews
CREATE TABLE public.student_strategy_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'fast',
  input_snapshot jsonb NOT NULL,
  output_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.student_strategy_reviews TO anon, authenticated;
GRANT ALL ON public.student_strategy_reviews TO service_role;
ALTER TABLE public.student_strategy_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access strategy reviews" ON public.student_strategy_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX strategy_reviews_student_idx ON public.student_strategy_reviews(student_id, created_at DESC);

-- 3. Outcomes share tokens
CREATE TABLE public.outcomes_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  cohort_year integer NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outcomes_share_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outcomes_share_tokens TO authenticated;
GRANT ALL ON public.outcomes_share_tokens TO service_role;
ALTER TABLE public.outcomes_share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read outcomes tokens" ON public.outcomes_share_tokens FOR SELECT USING (true);
CREATE POLICY "Open write outcomes tokens" ON public.outcomes_share_tokens FOR ALL USING (true) WITH CHECK (true);

-- 4. Benchmark settings (per-org / single-row for now)
CREATE TABLE public.org_benchmark_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  opted_in boolean NOT NULL DEFAULT false,
  last_computed_at timestamptz,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_benchmark_settings TO anon, authenticated;
GRANT ALL ON public.org_benchmark_settings TO service_role;
ALTER TABLE public.org_benchmark_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access benchmark settings" ON public.org_benchmark_settings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_org_benchmark_settings_updated_at BEFORE UPDATE ON public.org_benchmark_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Benchmark percentiles (cross-org aggregates)
CREATE TABLE public.benchmark_percentiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric text NOT NULL,
  period text NOT NULL,
  p25 numeric,
  p50 numeric,
  p75 numeric,
  sample_size integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric, period)
);
GRANT SELECT ON public.benchmark_percentiles TO anon, authenticated;
GRANT ALL ON public.benchmark_percentiles TO service_role;
ALTER TABLE public.benchmark_percentiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read percentiles" ON public.benchmark_percentiles FOR SELECT USING (true);
