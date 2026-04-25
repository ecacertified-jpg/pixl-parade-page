-- 1. Allow uploaders to update their own contributions
CREATE POLICY "Uploaders can update their own contributions"
  ON public.birthday_page_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploader_id)
  WITH CHECK (auth.uid() = uploader_id);

-- 2. Allow uploaders to delete their own contributions
CREATE POLICY "Uploaders can delete their own contributions"
  ON public.birthday_page_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploader_id);

-- 3. Allow page owner (celebrated user) to moderate (delete) any contribution on their page
CREATE POLICY "Page owner can delete any contribution"
  ON public.birthday_page_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id
        AND bp.user_id = auth.uid()
    )
  );

-- 4. Storage: allow uploader to delete their own files
-- File path convention: {pageId}/{userId}-{ts}.ext  OR  {pageId}/vid-{userId}-{ts}.ext
CREATE POLICY "Uploaders can delete their own birthday page media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'birthday-page-photos'
    AND (
      (storage.foldername(name))[2] LIKE auth.uid()::text || '-%'
      OR (storage.foldername(name))[2] LIKE 'vid-' || auth.uid()::text || '-%'
    )
  );

-- 5. Storage: allow uploader to update their own files
CREATE POLICY "Uploaders can update their own birthday page media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'birthday-page-photos'
    AND (
      (storage.foldername(name))[2] LIKE auth.uid()::text || '-%'
      OR (storage.foldername(name))[2] LIKE 'vid-' || auth.uid()::text || '-%'
    )
  );

-- 6. Storage: allow page owner to delete any file from their birthday page folder
CREATE POLICY "Page owner can delete birthday page media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'birthday-page-photos'
    AND EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id::text = (storage.foldername(name))[1]
        AND bp.user_id = auth.uid()
    )
  );