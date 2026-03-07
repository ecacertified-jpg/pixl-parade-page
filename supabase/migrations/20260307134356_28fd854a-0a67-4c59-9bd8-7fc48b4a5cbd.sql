-- INSERT : admins actifs peuvent uploader
CREATE POLICY "Admins can upload to assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- UPDATE : admins peuvent modifier
CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- DELETE : admins peuvent supprimer
CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);