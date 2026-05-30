
-- 1) Add event metadata to cover videos (library + per-page)
ALTER TABLE public.cover_video_library
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS event_label text;

ALTER TABLE public.birthday_page_cover_videos
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS event_label text;

-- 2) Owner view tracking table
CREATE TABLE IF NOT EXISTS public.birthday_page_cover_video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.birthday_page_cover_videos(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, owner_id)
);

CREATE INDEX IF NOT EXISTS bp_cover_video_views_owner_idx
  ON public.birthday_page_cover_video_views (owner_id, view_count);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.birthday_page_cover_video_views TO authenticated;
GRANT ALL ON public.birthday_page_cover_video_views TO service_role;

ALTER TABLE public.birthday_page_cover_video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their cover video views"
  ON public.birthday_page_cover_video_views FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert their cover video views"
  ON public.birthday_page_cover_video_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update their cover video views"
  ON public.birthday_page_cover_video_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER bp_cover_video_views_set_updated_at
  BEFORE UPDATE ON public.birthday_page_cover_video_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RPC: increment view count for the calling owner
CREATE OR REPLACE FUNCTION public.increment_cover_video_view(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.birthday_page_cover_video_views(video_id, owner_id, view_count, last_viewed_at)
  VALUES (p_video_id, auth.uid(), 1, now())
  ON CONFLICT (video_id, owner_id)
  DO UPDATE SET
    view_count = public.birthday_page_cover_video_views.view_count + 1,
    last_viewed_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_cover_video_view(uuid) TO authenticated;
