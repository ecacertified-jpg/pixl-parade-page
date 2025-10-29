-- Create favorites table with enrichment columns
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  notes text,
  priority_level text DEFAULT 'medium' CHECK (priority_level IN ('urgent', 'high', 'medium', 'low')),
  occasion_type text,
  accept_alternatives boolean DEFAULT true,
  context_usage text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_favorites_priority ON favorites(priority_level);
CREATE INDEX idx_favorites_occasion ON favorites(occasion_type);

-- Create wishlist_views table for tracking who viewed the wishlist
CREATE TABLE IF NOT EXISTS wishlist_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on wishlist_views
ALTER TABLE wishlist_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlist_views
CREATE POLICY "Users can view who viewed their wishlist"
  ON wishlist_views FOR SELECT
  USING (auth.uid() = wishlist_owner_id);

CREATE POLICY "Users can record wishlist views"
  ON wishlist_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Create indexes for wishlist_views
CREATE INDEX idx_wishlist_views_owner ON wishlist_views(wishlist_owner_id);
CREATE INDEX idx_wishlist_views_viewer ON wishlist_views(viewer_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER update_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_updated_at();