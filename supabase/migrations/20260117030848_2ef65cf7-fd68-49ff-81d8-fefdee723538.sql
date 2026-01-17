-- Add videos JSONB column to products table for multi-video support
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN products.videos IS 'Array of video objects with structure: {id, url, thumbnail_url, source, title, order}';

-- Migrate existing video data to new videos array format
UPDATE products 
SET videos = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', video_url,
    'thumbnail_url', video_thumbnail_url,
    'source', 'direct',
    'title', NULL,
    'order', 0
  )
)
WHERE video_url IS NOT NULL AND (videos IS NULL OR videos = '[]'::jsonb);

-- Create index for better query performance on videos
CREATE INDEX IF NOT EXISTS idx_products_videos ON products USING gin(videos);