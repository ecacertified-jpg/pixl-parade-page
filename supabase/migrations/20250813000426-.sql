-- Create user favorites table for storing user favorite products
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" 
ON public.user_favorites 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy to allow friends to see each other's favorites
CREATE POLICY "Friends can view favorites" 
ON public.user_favorites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE (user_a = auth.uid() AND user_b = user_favorites.user_id)
    OR (user_b = auth.uid() AND user_a = user_favorites.user_id)
  )
);

-- Function to get user favorites with product details
CREATE OR REPLACE FUNCTION public.get_user_favorites_with_products(p_user_id uuid)
RETURNS TABLE (
  favorite_id uuid,
  product_id uuid,
  product_name text,
  product_description text,
  product_price numeric,
  product_currency text,
  product_image_url text,
  product_category_id uuid,
  added_at timestamp with time zone,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.id as favorite_id,
    p.id as product_id,
    p.name as product_name,
    p.description as product_description,
    p.price as product_price,
    p.currency as product_currency,
    p.image_url as product_image_url,
    p.category_id as product_category_id,
    uf.created_at as added_at,
    uf.notes as notes
  FROM public.user_favorites uf
  JOIN public.products p ON p.id = uf.product_id
  WHERE uf.user_id = p_user_id
  AND p.is_active = true
  ORDER BY uf.created_at DESC;
END;
$$;

-- Function to get favorites suggestions based on friends' favorites
CREATE OR REPLACE FUNCTION public.get_favorites_suggestions(p_user_id uuid)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_description text,
  product_price numeric,
  product_currency text,
  product_image_url text,
  friend_count bigint,
  friends_names text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.description as product_description,
    p.price as product_price,
    p.currency as product_currency,
    p.image_url as product_image_url,
    COUNT(DISTINCT uf.user_id) as friend_count,
    STRING_AGG(DISTINCT COALESCE(profiles.first_name, 'Ami'), ', ') as friends_names
  FROM public.user_favorites uf
  JOIN public.products p ON p.id = uf.product_id
  LEFT JOIN public.profiles ON profiles.user_id = uf.user_id
  WHERE uf.user_id IN (
    SELECT CASE 
      WHEN cr.user_a = p_user_id THEN cr.user_b 
      ELSE cr.user_a 
    END
    FROM public.contact_relationships cr
    WHERE cr.user_a = p_user_id OR cr.user_b = p_user_id
  )
  AND uf.user_id != p_user_id
  AND p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_favorites uf_own 
    WHERE uf_own.user_id = p_user_id AND uf_own.product_id = p.id
  )
  GROUP BY p.id, p.name, p.description, p.price, p.currency, p.image_url
  ORDER BY friend_count DESC, p.name
  LIMIT 10;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_favorites_updated_at
BEFORE UPDATE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();