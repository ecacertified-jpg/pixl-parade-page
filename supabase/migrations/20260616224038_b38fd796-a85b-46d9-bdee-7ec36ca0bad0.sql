
CREATE TYPE public.celebration_post_kind AS ENUM ('text','photo','video','tribute','card');
CREATE TYPE public.celebration_page_type AS ENUM ('birthday','event','standalone');
CREATE TYPE public.celebration_visibility AS ENUM ('public','friends','private');

CREATE TABLE public.celebration_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  target_user_id uuid NULL,
  target_contact_id uuid NULL,
  page_type public.celebration_page_type NOT NULL DEFAULT 'standalone',
  page_id uuid NULL,
  kind public.celebration_post_kind NOT NULL DEFAULT 'text',
  content text NULL,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  music_track_id uuid NULL,
  is_premium boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_boosted boolean NOT NULL DEFAULT false,
  boost_expires_at timestamptz NULL,
  visibility public.celebration_visibility NOT NULL DEFAULT 'public',
  reactions_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  messages_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.celebration_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.celebration_posts TO authenticated;
GRANT ALL ON public.celebration_posts TO service_role;

ALTER TABLE public.celebration_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public celebration posts visible to all"
  ON public.celebration_posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Authors read own celebration posts"
  ON public.celebration_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Auth users create celebration posts"
  ON public.celebration_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors update own celebration posts"
  ON public.celebration_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors delete own celebration posts"
  ON public.celebration_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX idx_celebration_posts_page ON public.celebration_posts(page_type, page_id, created_at DESC);
CREATE INDEX idx_celebration_posts_author ON public.celebration_posts(author_id, created_at DESC);
CREATE INDEX idx_celebration_posts_feed ON public.celebration_posts(visibility, created_at DESC);

CREATE TABLE public.celebration_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.celebration_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

GRANT SELECT ON public.celebration_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.celebration_reactions TO authenticated;
GRANT ALL ON public.celebration_reactions TO service_role;

ALTER TABLE public.celebration_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Celebration reactions visible to all"
  ON public.celebration_reactions FOR SELECT
  USING (true);

CREATE POLICY "Auth users add own celebration reaction"
  ON public.celebration_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users remove own celebration reaction"
  ON public.celebration_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_celebration_reactions_post ON public.celebration_reactions(post_id);

CREATE TABLE public.celebration_wall_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NULL REFERENCES public.celebration_posts(id) ON DELETE CASCADE,
  page_type public.celebration_page_type NOT NULL DEFAULT 'standalone',
  page_id uuid NULL,
  author_id uuid NOT NULL,
  author_display_name text NULL,
  content text NOT NULL,
  audio_url text NULL,
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.celebration_wall_messages TO anon;
GRANT SELECT, INSERT, DELETE ON public.celebration_wall_messages TO authenticated;
GRANT ALL ON public.celebration_wall_messages TO service_role;

ALTER TABLE public.celebration_wall_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Celebration wall msgs visible to all"
  ON public.celebration_wall_messages FOR SELECT
  USING (true);

CREATE POLICY "Auth users post celebration wall msg"
  ON public.celebration_wall_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Auth users delete own celebration wall msg"
  ON public.celebration_wall_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX idx_celebration_wall_post ON public.celebration_wall_messages(post_id, created_at DESC);
CREATE INDEX idx_celebration_wall_page ON public.celebration_wall_messages(page_type, page_id, created_at DESC);

CREATE TABLE public.celebration_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.celebration_posts(id) ON DELETE CASCADE,
  viewer_id uuid NULL,
  viewer_session text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.celebration_post_views TO anon;
GRANT SELECT, INSERT ON public.celebration_post_views TO authenticated;
GRANT ALL ON public.celebration_post_views TO service_role;

ALTER TABLE public.celebration_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a celebration view"
  ON public.celebration_post_views FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.celebration_posts p WHERE p.id = post_id)
  );

CREATE POLICY "Post author reads own view logs"
  ON public.celebration_post_views FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.celebration_posts p
    WHERE p.id = post_id AND p.author_id = auth.uid()
  ));

CREATE INDEX idx_celebration_post_views_post ON public.celebration_post_views(post_id);

CREATE OR REPLACE FUNCTION public.celebration_reactions_count_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.celebration_posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.celebration_posts SET reactions_count = GREATEST(reactions_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER celebration_reactions_count_aiud
AFTER INSERT OR DELETE ON public.celebration_reactions
FOR EACH ROW EXECUTE FUNCTION public.celebration_reactions_count_trg();

CREATE OR REPLACE FUNCTION public.celebration_messages_count_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.celebration_posts SET messages_count = messages_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE public.celebration_posts SET messages_count = GREATEST(messages_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER celebration_messages_count_aiud
AFTER INSERT OR DELETE ON public.celebration_wall_messages
FOR EACH ROW EXECUTE FUNCTION public.celebration_messages_count_trg();

CREATE OR REPLACE FUNCTION public.celebration_posts_updated_at_trg()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER celebration_posts_set_updated_at
BEFORE UPDATE ON public.celebration_posts
FOR EACH ROW EXECUTE FUNCTION public.celebration_posts_updated_at_trg();

ALTER PUBLICATION supabase_realtime ADD TABLE public.celebration_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebration_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebration_wall_messages;
