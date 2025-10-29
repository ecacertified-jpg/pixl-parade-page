-- Add enrichment columns to existing user_favorites table
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'medium' CHECK (priority_level IN ('urgent', 'high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS occasion_type text,
ADD COLUMN IF NOT EXISTS accept_alternatives boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS context_usage text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better filtering
CREATE INDEX IF NOT EXISTS idx_user_favorites_priority ON user_favorites(priority_level);
CREATE INDEX IF NOT EXISTS idx_user_favorites_occasion ON user_favorites(occasion_type);

-- Create trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_user_favorites_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_favorites_updated_at ON user_favorites;

CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_user_favorites_updated_at();