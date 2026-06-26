
-- 1) Enrich event_wishes_messages
ALTER TABLE public.event_wishes_messages
  ALTER COLUMN message_text DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_metadata jsonb,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS card_template_id uuid,
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'safe',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitor_first_name text,
  ADD COLUMN IF NOT EXISTS visitor_phone_hash text,
  ADD COLUMN IF NOT EXISTS visitor_phone_country text;

CREATE INDEX IF NOT EXISTS idx_event_wishes_messages_page
  ON public.event_wishes_messages(event_page_id, created_at DESC);

-- Replace the overly permissive insert/read policies
DROP POLICY IF EXISTS "Anyone can view event wishes" ON public.event_wishes_messages;
DROP POLICY IF EXISTS "Authenticated users can add event wishes" ON public.event_wishes_messages;
DROP POLICY IF EXISTS "Users can delete own event wishes" ON public.event_wishes_messages;

CREATE POLICY "Public can read safe event messages"
  ON public.event_wishes_messages
  FOR SELECT
  USING (is_hidden = false AND moderation_status <> 'unsafe');

CREATE POLICY "Authenticated senders can post event messages"
  ON public.event_wishes_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Service role manages event messages"
  ON public.event_wishes_messages
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Event owner can manage messages"
  ON public.event_wishes_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_pages ep
      WHERE ep.id = event_wishes_messages.event_page_id
        AND ep.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_pages ep
      WHERE ep.id = event_wishes_messages.event_page_id
        AND ep.creator_id = auth.uid()
    )
  );

CREATE POLICY "Sender can delete own event message"
  ON public.event_wishes_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Admins can manage all event messages"
  ON public.event_wishes_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  );

-- 2) Enrich event_page_photos
ALTER TABLE public.event_page_photos
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_kind text,
  ADD COLUMN IF NOT EXISTS memory_audio_url text,
  ADD COLUMN IF NOT EXISTS memory_audio_duration integer;

-- 3) Favorites for event photos
CREATE TABLE IF NOT EXISTS public.event_page_photo_favorites (
  photo_id uuid NOT NULL REFERENCES public.event_page_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (photo_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.event_page_photo_favorites TO authenticated;
GRANT SELECT ON public.event_page_photo_favorites TO anon;
GRANT ALL ON public.event_page_photo_favorites TO service_role;

ALTER TABLE public.event_page_photo_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read event favorites on active pages"
  ON public.event_page_photo_favorites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_page_photos p
      JOIN public.event_pages ep ON ep.id = p.event_page_id
      WHERE p.id = event_page_photo_favorites.photo_id
        AND ep.is_active = true
    )
  );

CREATE POLICY "Users add their own event favorites"
  ON public.event_page_photo_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove their own event favorites"
  ON public.event_page_photo_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4) View counter for event photos
CREATE TABLE IF NOT EXISTS public.event_page_photo_views (
  photo_id uuid NOT NULL REFERENCES public.event_page_photos(id) ON DELETE CASCADE,
  viewer_id uuid,
  viewer_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_photo_views_photo ON public.event_page_photo_views(photo_id);

GRANT SELECT, INSERT ON public.event_page_photo_views TO authenticated, anon;
GRANT ALL ON public.event_page_photo_views TO service_role;
ALTER TABLE public.event_page_photo_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record event photo views"
  ON public.event_page_photo_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read event photo views"
  ON public.event_page_photo_views
  FOR SELECT
  USING (true);

-- 5) Social share photo on event pages
ALTER TABLE public.event_pages
  ADD COLUMN IF NOT EXISTS social_share_photo_id uuid;
