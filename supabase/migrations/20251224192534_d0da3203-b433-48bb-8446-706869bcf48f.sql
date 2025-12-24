-- Create student_conversations table for conversation logs
CREATE TABLE public.student_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES public.advisors(id) ON DELETE SET NULL,
  conversation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  summary TEXT NOT NULL,
  follow_up_actions TEXT,
  created_by TEXT NOT NULL DEFAULT 'advisor', -- 'advisor' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Allow public read on student_conversations" 
ON public.student_conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on student_conversations" 
ON public.student_conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on student_conversations" 
ON public.student_conversations 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on student_conversations" 
ON public.student_conversations 
FOR DELETE 
USING (true);

-- Add index for faster queries
CREATE INDEX idx_student_conversations_student_id ON public.student_conversations(student_id);
CREATE INDEX idx_student_conversations_advisor_id ON public.student_conversations(advisor_id);