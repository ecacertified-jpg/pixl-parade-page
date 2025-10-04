-- Étape 1: Supprimer l'ancienne contrainte
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_business_id_fkey;

-- Étape 2: Créer automatiquement des business_accounts pour les propriétaires qui n'en ont pas
-- en utilisant leurs informations de profil
INSERT INTO business_accounts (user_id, business_name, is_active)
SELECT DISTINCT 
  p.business_owner_id,
  COALESCE(
    prof.first_name || ' ' || prof.last_name,
    'Business ' || SUBSTRING(p.business_owner_id::text, 1, 8)
  ) as business_name,
  true as is_active
FROM products p
LEFT JOIN profiles prof ON prof.user_id = p.business_owner_id
WHERE p.business_owner_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM business_accounts ba 
  WHERE ba.user_id = p.business_owner_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Étape 3: Mettre à NULL les business_id qui pointent vers businesses (ancienne table)
UPDATE products 
SET business_id = NULL
WHERE business_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM business_accounts ba WHERE ba.id = products.business_id
);

-- Étape 4: Mettre à jour TOUS les produits pour qu'ils pointent vers business_accounts
UPDATE products 
SET business_id = (
  SELECT ba.id 
  FROM business_accounts ba
  WHERE ba.user_id = products.business_owner_id 
  LIMIT 1
)
WHERE business_owner_id IS NOT NULL;

-- Étape 5: Rendre business_id obligatoire
ALTER TABLE products 
ALTER COLUMN business_id SET NOT NULL;

-- Étape 6: Ajouter la contrainte vers business_accounts
ALTER TABLE products 
ADD CONSTRAINT products_business_id_fkey 
FOREIGN KEY (business_id) 
REFERENCES business_accounts(id) 
ON DELETE CASCADE;

-- Étape 7: Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);