-- Phase 1: Ajouter la relation business aux produits
-- Ajouter la colonne business_account_id avec contrainte de clé étrangère
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS business_account_id UUID REFERENCES business_accounts(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_products_business_account_id ON products(business_account_id);

-- Mettre à jour les produits existants pour les lier au premier business de chaque utilisateur
-- Cela garantit que les produits existants sont correctement liés
UPDATE products p
SET business_account_id = (
  SELECT ba.id 
  FROM business_accounts ba 
  WHERE ba.user_id = p.business_owner_id 
  ORDER BY ba.created_at ASC 
  LIMIT 1
)
WHERE p.business_account_id IS NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.business_account_id IS 'Référence au compte business auquel ce produit appartient';