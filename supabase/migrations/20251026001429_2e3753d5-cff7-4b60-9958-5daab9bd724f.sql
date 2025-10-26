-- Create product ratings table
CREATE TABLE public.product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  order_id UUID REFERENCES public.business_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view ratings"
ON public.product_ratings
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own ratings"
ON public.product_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.product_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.product_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_product_ratings_product_id ON public.product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id ON public.product_ratings(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_product_ratings_updated_at
BEFORE UPDATE ON public.product_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating_updated_at();

-- Create view for product average ratings
CREATE OR REPLACE VIEW public.product_rating_stats AS
SELECT 
  product_id,
  COUNT(*) as rating_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM public.product_ratings
GROUP BY product_id;