-- =====================================================================
-- Onboarding Questionnaire + Rose Voice Chat (Noga schema)
--
-- Mirrors TPR's public tables (onboarding_answers, voice_insights,
-- student_profiles, student_target_colleges) under the noga schema so
-- Noga can store its own answers / insights / profile data independently.
--
-- Notes
-- - RLS is "owner only" (auth.uid() = user_id) for simplicity. IEC admins
--   can read across via the existing helper if needed later.
-- - Renamed student_target_colleges -> user_target_colleges (and dropped
--   the legacy public schema's reference to profiles(user_id)) to make
--   the table role-agnostic in Noga.
-- - Reuses the existing public.update_updated_at_column() trigger fn,
--   already present in the project.
-- =====================================================================

-- ---------------------------------------------------------------------
-- noga.user_profiles  (mirrors TPR public.student_profiles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.user_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Auto-synced from onboarding answers
  grade            TEXT,
  graduation_year  INTEGER,
  gender           TEXT,
  age_range        TEXT,
  degree_type      TEXT,
  degree_interest  TEXT,
  university_name  TEXT,
  program          TEXT,
  background       TEXT,
  career_goals     TEXT,
  personal_strengths TEXT,
  inspiration      TEXT,
  personal_story   TEXT,
  years_experience TEXT,
  -- Manual fields
  phone            TEXT,
  gpa              NUMERIC,
  sat_score        INTEGER,
  act_score        INTEGER,
  parent_name      TEXT,
  parent_email     TEXT,
  parent_phone     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE noga.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own user_profile"
  ON noga.user_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_noga_user_profiles_updated_at
  BEFORE UPDATE ON noga.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- noga.onboarding_answers  (mirrors TPR public.onboarding_answers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.onboarding_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id        TEXT,
  answers             JSONB,
  gender              TEXT,
  age_range           TEXT,
  degree_type         TEXT,
  degree_interest     TEXT,
  inspiration         TEXT,
  personal_story      TEXT,
  university_name     TEXT,
  program             TEXT,
  background          TEXT,
  career_goals        TEXT,
  personal_strengths  TEXT,
  years_experience    TEXT,
  completed           BOOLEAN,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE noga.onboarding_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own onboarding_answers"
  ON noga.onboarding_answers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert onboarding_answers"
  ON noga.onboarding_answers FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_noga_onboarding_answers_updated_at
  BEFORE UPDATE ON noga.onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- noga.user_target_colleges  (mirrors TPR public.student_target_colleges)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.user_target_colleges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country    TEXT,
  college    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE noga.user_target_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own user_target_colleges"
  ON noga.user_target_colleges FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS user_target_colleges_user_id_idx
  ON noga.user_target_colleges (user_id);

-- ---------------------------------------------------------------------
-- noga.voice_insights  (mirrors TPR public.voice_insights)
-- Used by the Rose voice chat to persist post-call insights.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noga.voice_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insights    JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality     TEXT CHECK (quality IN ('strong', 'average', 'short')),
  transcript  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE noga.voice_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own voice_insights"
  ON noga.voice_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own voice_insights"
  ON noga.voice_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS voice_insights_user_id_idx
  ON noga.voice_insights (user_id);

-- ---------------------------------------------------------------------
-- noga.sync_profile_from_onboarding
--
-- After an onboarding_answers row is INSERTED or UPDATED, copy the
-- relevant columns into noga.user_profiles so the rest of the app can
-- read a single canonical profile row regardless of where the data
-- originally came from (questionnaire, manual edit, voice chat, etc.).
--
-- Runs as SECURITY DEFINER because the row's user_id has just been
-- authenticated by RLS at this point and we want to upsert into
-- user_profiles without re-checking RLS on the trigger path.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION noga.sync_profile_from_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = noga, public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO noga.user_profiles (
    user_id, gender, age_range, degree_type, degree_interest,
    university_name, program, background, career_goals,
    personal_strengths, inspiration, personal_story, years_experience
  )
  VALUES (
    NEW.user_id, NEW.gender, NEW.age_range, NEW.degree_type, NEW.degree_interest,
    NEW.university_name, NEW.program, NEW.background, NEW.career_goals,
    NEW.personal_strengths, NEW.inspiration, NEW.personal_story, NEW.years_experience
  )
  ON CONFLICT (user_id) DO UPDATE SET
    gender             = COALESCE(EXCLUDED.gender,             noga.user_profiles.gender),
    age_range          = COALESCE(EXCLUDED.age_range,          noga.user_profiles.age_range),
    degree_type        = COALESCE(EXCLUDED.degree_type,        noga.user_profiles.degree_type),
    degree_interest    = COALESCE(EXCLUDED.degree_interest,    noga.user_profiles.degree_interest),
    university_name    = COALESCE(EXCLUDED.university_name,    noga.user_profiles.university_name),
    program            = COALESCE(EXCLUDED.program,            noga.user_profiles.program),
    background         = COALESCE(EXCLUDED.background,         noga.user_profiles.background),
    career_goals       = COALESCE(EXCLUDED.career_goals,       noga.user_profiles.career_goals),
    personal_strengths = COALESCE(EXCLUDED.personal_strengths, noga.user_profiles.personal_strengths),
    inspiration        = COALESCE(EXCLUDED.inspiration,        noga.user_profiles.inspiration),
    personal_story     = COALESCE(EXCLUDED.personal_story,     noga.user_profiles.personal_story),
    years_experience   = COALESCE(EXCLUDED.years_experience,   noga.user_profiles.years_experience),
    updated_at         = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_from_onboarding_trg ON noga.onboarding_answers;
CREATE TRIGGER sync_profile_from_onboarding_trg
  AFTER INSERT OR UPDATE ON noga.onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION noga.sync_profile_from_onboarding();
