CREATE TABLE public.target_university_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.target_university_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on target_university_options" ON public.target_university_options FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on target_university_options" ON public.target_university_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on target_university_options" ON public.target_university_options FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on target_university_options" ON public.target_university_options FOR DELETE TO public USING (true);

INSERT INTO public.target_university_options (name, sort_order) VALUES
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