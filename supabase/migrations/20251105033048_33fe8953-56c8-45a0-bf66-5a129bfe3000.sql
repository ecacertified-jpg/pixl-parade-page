-- Add foreign key constraints to reported_posts table
ALTER TABLE reported_posts
  ADD CONSTRAINT fk_reported_posts_post
  FOREIGN KEY (post_id) 
  REFERENCES posts(id) 
  ON DELETE CASCADE;

ALTER TABLE reported_posts
  ADD CONSTRAINT fk_reported_posts_reporter
  FOREIGN KEY (reporter_id) 
  REFERENCES profiles(user_id) 
  ON DELETE CASCADE;

ALTER TABLE reported_posts
  ADD CONSTRAINT fk_reported_posts_reviewed_by
  FOREIGN KEY (reviewed_by) 
  REFERENCES admin_users(id) 
  ON DELETE SET NULL;

-- Create indexes for performance on reported_posts
CREATE INDEX IF NOT EXISTS idx_reported_posts_post_id 
  ON reported_posts(post_id);

CREATE INDEX IF NOT EXISTS idx_reported_posts_reporter_id 
  ON reported_posts(reporter_id);

CREATE INDEX IF NOT EXISTS idx_reported_posts_status 
  ON reported_posts(status);

-- Add comment for documentation
COMMENT ON TABLE reported_posts IS 'Stores user reports on posts with proper FK relationships';