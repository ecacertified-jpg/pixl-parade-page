-- Ajouter des colonnes pour catégoriser les produits et expériences
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_experience BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category_name TEXT,
ADD COLUMN IF NOT EXISTS experience_type TEXT;

-- Créer des index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_is_experience ON products(is_experience);

-- Commenter les colonnes pour documentation
COMMENT ON COLUMN products.is_experience IS 'Indique si le produit est une expérience (true) ou un produit physique (false)';
COMMENT ON COLUMN products.category_name IS 'Nom de la catégorie : Bijoux, Parfums, Tech, Mode, Artisanat, Gastronomie, Décoration, Bien-être pour les produits | Restaurants, Spa & Bien-être, Séjours, Événements, VIP pour les expériences';
COMMENT ON COLUMN products.experience_type IS 'Type d expérience spécifique (pour les expériences uniquement) : reservation, event, stay, spa, vip';