-- Create table for caching shortened URLs
CREATE TABLE IF NOT EXISTS shortened_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url text UNIQUE NOT NULL,
  short_url text NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_shortened_urls_original ON shortened_urls(original_url);

-- RLS: Only service role can access (edge functions use service role)
ALTER TABLE shortened_urls ENABLE ROW LEVEL SECURITY;

-- No policies needed - service role bypasses RLS
-- This ensures only edge functions can read/write to this cache table

-- Add trigger for updated_at
CREATE TRIGGER update_shortened_urls_updated_at
BEFORE UPDATE ON shortened_urls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();