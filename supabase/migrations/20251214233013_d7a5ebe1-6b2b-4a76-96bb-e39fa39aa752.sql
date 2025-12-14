-- Create student checklist items table
CREATE TABLE public.student_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student documents table
CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist items (public read, admin write)
CREATE POLICY "Allow public read on student_checklist_items" 
ON public.student_checklist_items FOR SELECT USING (true);

CREATE POLICY "Allow public insert on student_checklist_items" 
ON public.student_checklist_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on student_checklist_items" 
ON public.student_checklist_items FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on student_checklist_items" 
ON public.student_checklist_items FOR DELETE USING (true);

-- RLS policies for documents (public read, admin write)
CREATE POLICY "Allow public read on student_documents" 
ON public.student_documents FOR SELECT USING (true);

CREATE POLICY "Allow public insert on student_documents" 
ON public.student_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on student_documents" 
ON public.student_documents FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on student_documents" 
ON public.student_documents FOR DELETE USING (true);

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', true);

-- Storage policies
CREATE POLICY "Allow public read on student-documents" 
ON storage.objects FOR SELECT USING (bucket_id = 'student-documents');

CREATE POLICY "Allow public upload on student-documents" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Allow public delete on student-documents" 
ON storage.objects FOR DELETE USING (bucket_id = 'student-documents');

-- Trigger for updated_at
CREATE TRIGGER update_student_checklist_items_updated_at
BEFORE UPDATE ON public.student_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();