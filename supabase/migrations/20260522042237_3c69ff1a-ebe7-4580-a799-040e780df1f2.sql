
-- 1. Colonnes additionnelles sur birthday_page_photos
ALTER TABLE public.birthday_page_photos
  ADD COLUMN IF NOT EXISTS event_kind text,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_birthday_page_photos_event_kind
  ON public.birthday_page_photos (birthday_page_id, event_kind);

-- 2. Vues
CREATE TABLE IF NOT EXISTS public.birthday_page_photo_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.birthday_page_photos(id) ON DELETE CASCADE,
  viewer_id uuid,
  viewer_fingerprint text,
  viewed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_photo_view_user_day
  ON public.birthday_page_photo_views (photo_id, viewer_id, viewed_on)
  WHERE viewer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_photo_view_fp_day
  ON public.birthday_page_photo_views (photo_id, viewer_fingerprint, viewed_on)
  WHERE viewer_id IS NULL AND viewer_fingerprint IS NOT NULL;

ALTER TABLE public.birthday_page_photo_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read views of active pages"
  ON public.birthday_page_photo_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_page_photos p
      JOIN public.birthday_pages bp ON bp.id = p.birthday_page_id
      WHERE p.id = birthday_page_photo_views.photo_id
        AND bp.is_active = true
    )
  );

-- 3. Favoris
CREATE TABLE IF NOT EXISTS public.birthday_page_photo_favorites (
  photo_id uuid NOT NULL REFERENCES public.birthday_page_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (photo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_favorites_user ON public.birthday_page_photo_favorites (user_id);

ALTER TABLE public.birthday_page_photo_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read favorites on active pages"
  ON public.birthday_page_photo_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_page_photos p
      JOIN public.birthday_pages bp ON bp.id = p.birthday_page_id
      WHERE p.id = birthday_page_photo_favorites.photo_id
        AND bp.is_active = true
    )
  );

CREATE POLICY "Users can add their own favorites"
  ON public.birthday_page_photo_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.birthday_page_photo_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 4. RPC: record view + increment counter
CREATE OR REPLACE FUNCTION public.record_album_photo_view(
  _photo_id uuid,
  _fingerprint text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _inserted boolean := false;
BEGIN
  -- Verify the photo belongs to an active page
  IF NOT EXISTS (
    SELECT 1 FROM public.birthday_page_photos p
    JOIN public.birthday_pages bp ON bp.id = p.birthday_page_id
    WHERE p.id = _photo_id AND bp.is_active = true
  ) THEN
    RETURN;
  END IF;

  IF _uid IS NOT NULL THEN
    INSERT INTO public.birthday_page_photo_views (photo_id, viewer_id)
    VALUES (_photo_id, _uid)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS _inserted = ROW_COUNT;
  ELSIF _fingerprint IS NOT NULL THEN
    INSERT INTO public.birthday_page_photo_views (photo_id, viewer_fingerprint)
    VALUES (_photo_id, _fingerprint)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS _inserted = ROW_COUNT;
  END IF;

  IF _inserted THEN
    UPDATE public.birthday_page_photos
    SET view_count = view_count + 1
    WHERE id = _photo_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_album_photo_view(uuid, text) TO anon, authenticated;
