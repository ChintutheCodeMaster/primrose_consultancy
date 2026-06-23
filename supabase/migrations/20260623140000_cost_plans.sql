-- =============================================================================
-- Port TPR's Tuition Calculator + Scholarship Finder into Noga
-- =============================================================================
-- Adds noga.cost_plans for saved cost-plan snapshots (used by the Study Cost
-- Planner). Mirrors TPR's public.cost_plans shape, with student_id remapped
-- from auth.users(id) to noga.students(id) per Noga's domain-table pattern.
--
-- ScholarshipFinder does not persist anything to the DB (saves are
-- client-side), so this migration is cost_plans only.
-- =============================================================================

CREATE TABLE noga.cost_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL REFERENCES noga.students(id) ON DELETE CASCADE,

  -- inputs
  country             text NOT NULL,
  city                text,
  degree              text NOT NULL CHECK (degree IN ('undergrad', 'masters', 'mba')),
  field_of_study      text NOT NULL,
  living_style        text NOT NULL CHECK (living_style IN ('budget', 'standard', 'premium')),
  duration_years      integer NOT NULL CHECK (duration_years BETWEEN 1 AND 10),
  city_multiplier     numeric(4, 2) NOT NULL DEFAULT 1.0,

  -- computed totals (snapshotted)
  annual_min          integer NOT NULL,
  annual_max          integer NOT NULL,
  program_min         integer NOT NULL,
  program_max         integer NOT NULL,
  monthly_living_min  integer NOT NULL,
  monthly_living_max  integer NOT NULL,
  affordability       text CHECK (affordability IN ('affordable', 'moderate', 'high')),

  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cost_plans_student_id ON noga.cost_plans (student_id);
CREATE INDEX idx_cost_plans_created_at ON noga.cost_plans (created_at DESC);

ALTER TABLE noga.cost_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on cost_plans"
  ON noga.cost_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cost_plans"
  ON noga.cost_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cost_plans"
  ON noga.cost_plans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cost_plans"
  ON noga.cost_plans FOR DELETE USING (true);
