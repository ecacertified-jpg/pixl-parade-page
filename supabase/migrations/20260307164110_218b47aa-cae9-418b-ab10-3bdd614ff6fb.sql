DROP POLICY IF EXISTS "Admins can upload to assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete assets" ON storage.objects;

CREATE POLICY "Admins can upload to assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);