-- Create sidebar_categories table for dynamic year management
CREATE TABLE public.sidebar_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_type TEXT NOT NULL, -- 'leads', 'past_clients', 'did_not_continue'
  year_value TEXT NOT NULL,
  display_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sidebar_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (same pattern as other tables)
CREATE POLICY "Allow public read on sidebar_categories" 
ON public.sidebar_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on sidebar_categories" 
ON public.sidebar_categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on sidebar_categories" 
ON public.sidebar_categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on sidebar_categories" 
ON public.sidebar_categories 
FOR DELETE 
USING (true);

-- Insert initial data for leads
INSERT INTO public.sidebar_categories (category_type, year_value, display_label, sort_order) VALUES
('leads', '27', 'מתעניינים 27', 1),
('leads', '26', 'מתעניינים 26', 2),
('leads', '25', 'מתעניינים 25', 3),
('leads', '24', 'מתעניינים 24', 4),
('leads', '23', 'מתעניינים 23', 5);

-- Insert initial data for past_clients
INSERT INTO public.sidebar_categories (category_type, year_value, display_label, sort_order) VALUES
('past_clients', '2026', 'לקוחות עבר 2026', 1),
('past_clients', '2025', 'לקוחות עבר 2025', 2),
('past_clients', '2024', 'לקוחות עבר 2024', 3),
('past_clients', '2023', 'לקוחות עבר 2023', 4),
('past_clients', '2021-22', 'לקוחות עבר 2021-22', 5);

-- Insert initial data for did_not_continue
INSERT INTO public.sidebar_categories (category_type, year_value, display_label, sort_order) VALUES
('did_not_continue', '2025-ומטה', '2025 ומטה', 1),
('did_not_continue', '2026', '2026', 2),
('did_not_continue', '2027', '2027', 3),
('did_not_continue', '2028', '2028', 4);