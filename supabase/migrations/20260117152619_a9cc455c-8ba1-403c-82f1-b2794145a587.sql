-- Add UPDATE policy for student_agreements table
CREATE POLICY "Allow public update on student_agreements" 
ON public.student_agreements 
FOR UPDATE 
USING (true);