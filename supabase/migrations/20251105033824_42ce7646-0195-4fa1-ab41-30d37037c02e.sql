-- Clean up duplicate foreign keys and add missing FK
-- Drop old automatically generated foreign keys if they exist
ALTER TABLE reported_posts 
  DROP CONSTRAINT IF EXISTS reported_posts_post_id_fkey;

ALTER TABLE reported_posts 
  DROP CONSTRAINT IF EXISTS reported_posts_reporter_id_fkey;

ALTER TABLE reported_posts 
  DROP CONSTRAINT IF EXISTS reported_posts_reviewed_by_fkey;

-- Add foreign key from posts to profiles (was missing)
ALTER TABLE posts
  ADD CONSTRAINT fk_posts_user
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id 
  ON posts(user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT fk_posts_user ON posts IS 'Links posts to user profiles for author information';