-- Add video support columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

COMMENT ON COLUMN products.video_url IS 'URL de la vidéo du produit (stockée dans Supabase Storage)';
COMMENT ON COLUMN products.video_thumbnail_url IS 'URL de la miniature personnalisée pour la vidéo';

-- Create storage bucket for product videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for business owners to upload videos
CREATE POLICY "Business owners can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
);

-- RLS policy for public read access
CREATE POLICY "Public can view product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

-- RLS policy for business owners to update their videos
CREATE POLICY "Business owners can update product videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

-- RLS policy for business owners to delete their videos
CREATE POLICY "Business owners can delete product videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');