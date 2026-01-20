-- Créer le bucket public pour les images OG cachées
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images-cache',
  'og-images-cache',
  true,
  2097152, -- 2MB max par image
  ARRAY['image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS : Lecture publique (les crawlers doivent pouvoir accéder)
CREATE POLICY "Public read access for OG images"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images-cache');

-- RLS : Écriture par service role uniquement (via Edge Functions)
CREATE POLICY "Service role can upload OG images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'og-images-cache');

CREATE POLICY "Service role can update OG images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'og-images-cache');

CREATE POLICY "Service role can delete OG images"
ON storage.objects FOR DELETE
USING (bucket_id = 'og-images-cache');

-- Table pour tracker les métadonnées du cache
CREATE TABLE IF NOT EXISTS public.og_image_cache_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'product', 'fund', 'business'
  entity_id uuid NOT NULL,
  cache_key text NOT NULL UNIQUE,
  storage_path text NOT NULL,
  data_hash text NOT NULL, -- Hash des données pour détecter changements
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_og_cache_entity ON og_image_cache_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_og_cache_key ON og_image_cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_og_cache_expires ON og_image_cache_metadata(expires_at);

-- RLS pour la table metadata
ALTER TABLE og_image_cache_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cache metadata"
ON og_image_cache_metadata FOR SELECT
USING (true);

CREATE POLICY "Service role can manage cache metadata"
ON og_image_cache_metadata FOR ALL
USING (true)
WITH CHECK (true);

-- Fonction pour invalider le cache OG d'un produit
CREATE OR REPLACE FUNCTION invalidate_product_og_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM og_image_cache_metadata
  WHERE entity_type = 'product' AND entity_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour invalider le cache produit
DROP TRIGGER IF EXISTS trigger_invalidate_product_og_cache ON products;
CREATE TRIGGER trigger_invalidate_product_og_cache
AFTER UPDATE OF name, price, image_url ON products
FOR EACH ROW
EXECUTE FUNCTION invalidate_product_og_cache();

-- Fonction pour invalider le cache OG d'un business
CREATE OR REPLACE FUNCTION invalidate_business_og_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM og_image_cache_metadata
  WHERE entity_type = 'business' AND entity_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour invalider le cache business
DROP TRIGGER IF EXISTS trigger_invalidate_business_og_cache ON business_accounts;
CREATE TRIGGER trigger_invalidate_business_og_cache
AFTER UPDATE OF business_name, business_type, logo_url, description ON business_accounts
FOR EACH ROW
EXECUTE FUNCTION invalidate_business_og_cache();

-- Fonction pour nettoyer les caches expirés
CREATE OR REPLACE FUNCTION cleanup_expired_og_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM og_image_cache_metadata
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;