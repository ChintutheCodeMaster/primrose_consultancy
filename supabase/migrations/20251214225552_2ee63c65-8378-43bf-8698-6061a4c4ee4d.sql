-- Add more fields to advisors table
ALTER TABLE public.advisors 
ADD COLUMN payment_type TEXT DEFAULT 'per_package',
ADD COLUMN payment_amount NUMERIC DEFAULT 0,
ADD COLUMN payment_notes TEXT,
ADD COLUMN contract_url TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create storage bucket for advisor contracts
INSERT INTO storage.buckets (id, name, public) VALUES ('advisor-contracts', 'advisor-contracts', true);

-- Create storage policies for advisor contracts
CREATE POLICY "Allow public read on advisor-contracts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'advisor-contracts');

CREATE POLICY "Allow public insert on advisor-contracts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'advisor-contracts');

CREATE POLICY "Allow public update on advisor-contracts" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'advisor-contracts');

CREATE POLICY "Allow public delete on advisor-contracts" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'advisor-contracts');