
-- Table: event_pages
CREATE TABLE public.event_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  cover_image_url text,
  event_date date,
  fund_id uuid REFERENCES public.collective_funds(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_pages_slug ON public.event_pages (slug);
CREATE INDEX idx_event_pages_creator ON public.event_pages (creator_id);

ALTER TABLE public.event_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active event pages
CREATE POLICY "Anyone can view active event pages"
  ON public.event_pages FOR SELECT
  USING (is_active = true);

-- Creator can view all their pages (including inactive)
CREATE POLICY "Creator can view own event pages"
  ON public.event_pages FOR SELECT
  USING (auth.uid() = creator_id);

-- Creator can insert
CREATE POLICY "Creator can create event pages"
  ON public.event_pages FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creator can update
CREATE POLICY "Creator can update own event pages"
  ON public.event_pages FOR UPDATE
  USING (auth.uid() = creator_id);

-- Creator can delete
CREATE POLICY "Creator can delete own event pages"
  ON public.event_pages FOR DELETE
  USING (auth.uid() = creator_id);

-- Trigger for updated_at
CREATE TRIGGER update_event_pages_updated_at
  BEFORE UPDATE ON public.event_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table: event_page_photos
CREATE TABLE public.event_page_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_page_id uuid NOT NULL REFERENCES public.event_pages(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_name text,
  image_url text NOT NULL,
  caption text,
  media_type text NOT NULL DEFAULT 'image',
  video_url text,
  video_thumbnail_url text,
  memory_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_page_photos_page ON public.event_page_photos (event_page_id);

ALTER TABLE public.event_page_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos on active event pages
CREATE POLICY "Anyone can view event page photos"
  ON public.event_page_photos FOR SELECT
  USING (true);

-- Authenticated users can add photos
CREATE POLICY "Authenticated users can add event photos"
  ON public.event_page_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own event photos"
  ON public.event_page_photos FOR DELETE
  USING (auth.uid() = uploader_id);

-- Table: event_wishes_messages
CREATE TABLE public.event_wishes_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_page_id uuid NOT NULL REFERENCES public.event_pages(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  message_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_wishes_page ON public.event_wishes_messages (event_page_id);

ALTER TABLE public.event_wishes_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view wishes
CREATE POLICY "Anyone can view event wishes"
  ON public.event_wishes_messages FOR SELECT
  USING (true);

-- Authenticated users can add wishes
CREATE POLICY "Authenticated users can add event wishes"
  ON public.event_wishes_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own wishes
CREATE POLICY "Users can delete own event wishes"
  ON public.event_wishes_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Storage bucket for event page photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-page-photos', 'event-page-photos', true);

-- Storage policies
CREATE POLICY "Event photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-page-photos');

CREATE POLICY "Authenticated users can upload event photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-page-photos');

CREATE POLICY "Users can delete own event photos from storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-page-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
