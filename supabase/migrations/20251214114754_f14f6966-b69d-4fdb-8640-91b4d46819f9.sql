-- Fix STORAGE_EXPOSURE: Restore business-owner-only restrictions on products bucket

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;

-- Restore secure business owner policies
CREATE POLICY "Business owners can upload product images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.uid() IN (
    SELECT user_id FROM public.business_accounts
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business owners can update their product images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.uid() IN (
    SELECT user_id FROM public.business_accounts
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business owners can delete their product images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.uid() IN (
    SELECT user_id FROM public.business_accounts
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Keep public read access for product images (needed for shop display)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- Add file size and type restrictions for additional security
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB max
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'products';