-- Cover videos library + per-page user uploads
CREATE TYPE public.cover_video_schedule_kind AS ENUM (
  'greeting_morning',
  'greeting_afternoon',
  'greeting_evening',
  'greeting_night',
  'calendar_event',
  'birthday_day'
);

-- Admin-curated default library
CREATE TABLE public.cover_video_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  video_url text NOT NULL,
  poster_url text,
  schedule_kind public.cover_video_schedule_kind NOT NULL,
  calendar_month smallint CHECK (calendar_month BETWEEN 1 AND 12),
  calendar_day smallint CHECK (calendar_day BETWEEN 1 AND 31),
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cover_video_library_kind_idx ON public.cover_video_library (schedule_kind, is_active);

ALTER TABLE public.cover_video_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active cover library"
  ON public.cover_video_library FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all cover library"
  ON public.cover_video_library FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert cover library"
  ON public.cover_video_library FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update cover library"
  ON public.cover_video_library FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete cover library"
  ON public.cover_video_library FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Per-page custom user videos
CREATE TABLE public.birthday_page_cover_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_page_id uuid NOT NULL REFERENCES public.birthday_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  schedule_kind public.cover_video_schedule_kind NOT NULL,
  video_url text NOT NULL,
  poster_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX birthday_page_cover_videos_page_idx ON public.birthday_page_cover_videos (birthday_page_id, schedule_kind, is_active);

ALTER TABLE public.birthday_page_cover_videos ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Owners manage their page cover videos"
  ON public.birthday_page_cover_videos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read if parent page is active
CREATE POLICY "Public can read videos of active pages"
  ON public.birthday_page_cover_videos FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id AND bp.is_active = true
    )
  );

-- Storage policies: assets bucket is public; restrict writes
-- Admin folder: cover-videos/*
CREATE POLICY "Admins upload cover-videos folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'cover-videos'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins update cover-videos folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'cover-videos'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins delete cover-videos folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'cover-videos'
    AND public.is_admin(auth.uid())
  );

-- User folder: birthday-pages/{uid}/cover-videos/*
CREATE POLICY "Users upload their birthday cover videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'birthday-pages'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] = 'cover-videos'
  );

CREATE POLICY "Users update their birthday cover videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'birthday-pages'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] = 'cover-videos'
  );

CREATE POLICY "Users delete their birthday cover videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'birthday-pages'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] = 'cover-videos'
  );

-- updated_at triggers
CREATE TRIGGER cover_video_library_set_updated_at
  BEFORE UPDATE ON public.cover_video_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER birthday_page_cover_videos_set_updated_at
  BEFORE UPDATE ON public.birthday_page_cover_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();