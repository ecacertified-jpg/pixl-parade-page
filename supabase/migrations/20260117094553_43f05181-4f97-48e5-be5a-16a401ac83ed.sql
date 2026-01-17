-- Create storage bucket for business gallery media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-gallery', 
  'business-gallery', 
  true,
  52428800, -- 50 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- RLS policies for the bucket

-- Public can view business gallery media
CREATE POLICY "Public can view business gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-gallery');

-- Authenticated users can upload to their business gallery
CREATE POLICY "Authenticated users can upload to business gallery"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-gallery' AND
  auth.role() = 'authenticated'
);

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update business gallery"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-gallery' AND
  auth.role() = 'authenticated'
);

-- Authenticated users can delete from their gallery
CREATE POLICY "Authenticated users can delete from business gallery"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-gallery' AND
  auth.role() = 'authenticated'
);