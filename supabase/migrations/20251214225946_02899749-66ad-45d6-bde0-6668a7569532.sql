
-- Create table for signed agreements
CREATE TABLE public.student_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  id_number text NOT NULL,
  address text NOT NULL,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_agreements ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for signing)
CREATE POLICY "Allow public insert on student_agreements"
ON public.student_agreements
FOR INSERT
WITH CHECK (true);

-- Allow public read (for verification)
CREATE POLICY "Allow public read on student_agreements"
ON public.student_agreements
FOR SELECT
USING (true);

-- Allow public delete
CREATE POLICY "Allow public delete on student_agreements"
ON public.student_agreements
FOR DELETE
USING (true);

-- Add unique constraint - one agreement per student
ALTER TABLE public.student_agreements ADD CONSTRAINT unique_student_agreement UNIQUE (student_id);
