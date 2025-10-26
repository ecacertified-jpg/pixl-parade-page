-- Ajouter la colonne location_name à la table products
ALTER TABLE products 
ADD COLUMN location_name TEXT;

-- Index pour améliorer les performances de filtrage
CREATE INDEX idx_products_location_name ON products(location_name);

-- Activer la réplication complète pour business_accounts (pour Realtime)
ALTER TABLE business_accounts REPLICA IDENTITY FULL;