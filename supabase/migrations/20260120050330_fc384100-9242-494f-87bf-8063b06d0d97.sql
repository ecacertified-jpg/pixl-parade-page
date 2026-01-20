-- =====================================================
-- PRODUCT POPULARITY METRICS - Tables & Columns
-- =====================================================

-- Ajouter les colonnes de métriques sur products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popularity_score NUMERIC DEFAULT 0;

-- Index pour le tri par popularité
CREATE INDEX IF NOT EXISTS idx_products_popularity 
ON products(popularity_score DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_view_count 
ON products(view_count DESC) 
WHERE is_active = true;

-- Table pour tracker les vues de produits
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);

-- RLS pour product_views
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut logger une vue
CREATE POLICY "Anyone can log product views"
ON product_views FOR INSERT
WITH CHECK (true);

-- Les propriétaires de business peuvent voir les stats de leurs produits
CREATE POLICY "Business owners can view their product stats"
ON product_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_views.product_id
    AND p.business_owner_id = auth.uid()
  )
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all product views"
ON product_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =====================================================
-- POPULARITY SCORE FUNCTION
-- =====================================================

-- Fonction pour calculer le score de popularité
CREATE OR REPLACE FUNCTION calculate_product_popularity_score(
  p_view_count INTEGER,
  p_order_count INTEGER,
  p_favorites_count INTEGER,
  p_avg_rating NUMERIC,
  p_rating_count INTEGER,
  p_share_count INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
BEGIN
  -- Poids des différents facteurs
  -- Commandes : poids le plus élevé (conversion réelle)
  score := score + (COALESCE(p_order_count, 0) * 10);
  
  -- Favoris : intention d'achat forte
  score := score + (COALESCE(p_favorites_count, 0) * 5);
  
  -- Vues : engagement de base
  score := score + (COALESCE(p_view_count, 0) * 0.1);
  
  -- Notes : qualité perçue (pondéré par nombre d'avis)
  IF p_rating_count > 0 THEN
    score := score + (COALESCE(p_avg_rating, 0) * p_rating_count * 2);
  END IF;
  
  -- Partages : viralité
  score := score + (COALESCE(p_share_count, 0) * 3);
  
  RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- UPDATE METRICS FUNCTION
-- =====================================================

-- Fonction pour recalculer les métriques d'un produit
CREATE OR REPLACE FUNCTION update_product_metrics(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_view_count INTEGER;
  v_order_count INTEGER;
  v_favorites_count INTEGER;
  v_avg_rating NUMERIC;
  v_rating_count INTEGER;
  v_share_count INTEGER;
  v_popularity_score NUMERIC;
BEGIN
  -- Compter les vues
  SELECT COUNT(*) INTO v_view_count
  FROM product_views
  WHERE product_id = p_product_id;
  
  -- Compter les commandes (approximation via order_summary JSONB)
  SELECT COUNT(*) INTO v_order_count
  FROM business_orders
  WHERE order_summary::text LIKE '%' || p_product_id::text || '%'
  AND status IN ('confirmed', 'delivered', 'completed');
  
  -- Compter les favoris
  SELECT COUNT(*) INTO v_favorites_count
  FROM user_favorites
  WHERE product_id = p_product_id;
  
  -- Récupérer les stats de notes
  SELECT COALESCE(average_rating, 0), COALESCE(rating_count, 0)
  INTO v_avg_rating, v_rating_count
  FROM product_rating_stats
  WHERE product_id = p_product_id;
  
  -- Récupérer les partages
  SELECT COALESCE(total_shares, 0) INTO v_share_count
  FROM product_share_stats
  WHERE product_id = p_product_id;
  
  -- Calculer le score
  v_popularity_score := calculate_product_popularity_score(
    v_view_count,
    v_order_count,
    v_favorites_count,
    v_avg_rating,
    v_rating_count,
    v_share_count
  );
  
  -- Mettre à jour le produit
  UPDATE products
  SET 
    view_count = v_view_count,
    order_count = v_order_count,
    favorites_count = v_favorites_count,
    popularity_score = v_popularity_score,
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Trigger après insertion d'une vue
CREATE OR REPLACE FUNCTION trigger_update_metrics_on_view()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_product_metrics(NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_view_insert ON product_views;
CREATE TRIGGER on_product_view_insert
AFTER INSERT ON product_views
FOR EACH ROW
EXECUTE FUNCTION trigger_update_metrics_on_view();

-- Trigger après ajout/suppression favori
CREATE OR REPLACE FUNCTION trigger_update_metrics_on_favorite()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_product_metrics(NEW.product_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_product_metrics(OLD.product_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_favorite_change ON user_favorites;
CREATE TRIGGER on_favorite_change
AFTER INSERT OR DELETE ON user_favorites
FOR EACH ROW
EXECUTE FUNCTION trigger_update_metrics_on_favorite();