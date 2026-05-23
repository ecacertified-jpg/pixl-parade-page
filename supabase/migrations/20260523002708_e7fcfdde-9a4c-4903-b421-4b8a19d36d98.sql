
ALTER TABLE public.birthday_page_photos
  ADD COLUMN IF NOT EXISTS memory_audio_url text,
  ADD COLUMN IF NOT EXISTS memory_audio_duration integer;

CREATE TABLE IF NOT EXISTS public.album_photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.birthday_page_photos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_album_photo_comments_photo ON public.album_photo_comments(photo_id, created_at DESC);

ALTER TABLE public.album_photo_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read comments on active album photos" ON public.album_photo_comments;
CREATE POLICY "Public can read comments on active album photos"
  ON public.album_photo_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.birthday_page_photos p
      JOIN public.birthday_pages bp ON bp.id = p.birthday_page_id
      WHERE p.id = album_photo_comments.photo_id
        AND bp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.album_photo_comments;
CREATE POLICY "Authenticated users can comment"
  ON public.album_photo_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors and page owners can delete comments" ON public.album_photo_comments;
CREATE POLICY "Authors and page owners can delete comments"
  ON public.album_photo_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.birthday_page_photos p
      JOIN public.birthday_pages bp ON bp.id = p.birthday_page_id
      WHERE p.id = album_photo_comments.photo_id
        AND bp.user_id = auth.uid()
    )
  );
