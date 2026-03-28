
-- Table birthday_pages
CREATE TABLE public.birthday_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  celebration_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  title text NOT NULL,
  cover_image_url text,
  fund_id uuid REFERENCES public.collective_funds(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_birthday_pages_slug ON public.birthday_pages (slug);
CREATE INDEX idx_birthday_pages_user_id ON public.birthday_pages (user_id);

ALTER TABLE public.birthday_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view active birthday pages"
  ON public.birthday_pages FOR SELECT
  USING (is_active = true);

-- Owner can manage
CREATE POLICY "Owner can manage their birthday pages"
  ON public.birthday_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role insert (for edge functions)
CREATE POLICY "Service can insert birthday pages"
  ON public.birthday_pages FOR INSERT
  WITH CHECK (true);

-- Table birthday_page_photos
CREATE TABLE public.birthday_page_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_page_id uuid NOT NULL REFERENCES public.birthday_pages(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_name text,
  image_url text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_birthday_page_photos_page ON public.birthday_page_photos (birthday_page_id);

ALTER TABLE public.birthday_page_photos ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view birthday page photos"
  ON public.birthday_page_photos FOR SELECT
  USING (true);

-- Authenticated can insert
CREATE POLICY "Authenticated users can add photos"
  ON public.birthday_page_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

-- Add birthday_page_id to birthday_wishes_messages
ALTER TABLE public.birthday_wishes_messages 
  ADD COLUMN IF NOT EXISTS birthday_page_id uuid REFERENCES public.birthday_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bwm_birthday_page ON public.birthday_wishes_messages (birthday_page_id);

-- Storage bucket for birthday page photos
INSERT INTO storage.buckets (id, name, public) VALUES ('birthday-page-photos', 'birthday-page-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view birthday page photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'birthday-page-photos');

CREATE POLICY "Authenticated users can upload birthday page photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'birthday-page-photos');
