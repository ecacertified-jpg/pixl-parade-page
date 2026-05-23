ALTER TABLE public.birthday_page_photos
  ALTER COLUMN image_url DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can view birthday page photos" ON public.birthday_page_photos;
CREATE POLICY "Anyone can view birthday page photos"
  ON public.birthday_page_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_photos.birthday_page_id
        AND bp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can add photos" ON public.birthday_page_photos;
CREATE POLICY "Authenticated users can add photos"
  ON public.birthday_page_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1
      FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_photos.birthday_page_id
        AND bp.is_active = true
    )
  );