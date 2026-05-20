DROP POLICY IF EXISTS "Owners can upload birthday page photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload to active birthday pages"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'birthday-page-photos'
  AND EXISTS (
    SELECT 1 FROM public.birthday_pages bp
    WHERE bp.id::text = (storage.foldername(objects.name))[1]
      AND bp.is_active = true
  )
);