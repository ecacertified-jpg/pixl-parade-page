-- Create products storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Business owners can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM business_accounts 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business owners can update their product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM business_accounts 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business owners can delete their product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM business_accounts 
    WHERE user_id = auth.uid() AND is_active = true
  )
);