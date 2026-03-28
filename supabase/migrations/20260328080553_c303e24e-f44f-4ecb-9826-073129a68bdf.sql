-- Extend birthday_page_photos to support videos and text memories
ALTER TABLE public.birthday_page_photos
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS video_thumbnail_url text,
ADD COLUMN IF NOT EXISTS memory_text text;

-- Add constraint for valid media types
ALTER TABLE public.birthday_page_photos
ADD CONSTRAINT birthday_page_photos_media_type_check
CHECK (media_type IN ('image', 'video', 'memory'));