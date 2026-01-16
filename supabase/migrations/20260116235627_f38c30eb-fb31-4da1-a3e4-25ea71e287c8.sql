-- Fix storage policies to allow admins to upload product images
-- Drop existing restrictive policies on products bucket
DROP POLICY IF EXISTS "Business owners can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can delete their product images" ON storage.objects;

-- New INSERT policy: business owners OR active admins can upload
CREATE POLICY "Business owners or admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND (
    -- Business owners with active accounts
    EXISTS (
      SELECT 1 FROM public.business_accounts 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR 
    -- Active admins (super_admin, admin)
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- New UPDATE policy: business owners OR active admins can update
CREATE POLICY "Business owners or admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' 
  AND (
    EXISTS (
      SELECT 1 FROM public.business_accounts 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- New DELETE policy: business owners OR active admins can delete
CREATE POLICY "Business owners or admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' 
  AND (
    EXISTS (
      SELECT 1 FROM public.business_accounts 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);