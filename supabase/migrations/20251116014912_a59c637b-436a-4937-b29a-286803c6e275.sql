-- Phase 3: Nettoyage et unification complète des business
-- ========================================================

-- Étape 1: Migrer les données de businesses vers business_accounts si elles n'existent pas déjà
-- (Uniquement si un business existe dans businesses mais pas dans business_accounts)
INSERT INTO business_accounts (
  user_id,
  business_name,
  business_type,
  phone,
  address,
  description,
  logo_url,
  website_url,
  email,
  opening_hours,
  delivery_zones,
  payment_info,
  delivery_settings,
  is_active
)
SELECT 
  b.user_id,
  b.business_name,
  b.business_type,
  b.phone,
  b.address,
  b.description,
  b.logo_url,
  b.website_url,
  b.email,
  b.opening_hours,
  b.delivery_zones,
  b.payment_info,
  b.delivery_settings,
  COALESCE(b.is_active, true)
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM business_accounts ba 
  WHERE ba.user_id = b.user_id 
  AND ba.business_name = b.business_name
)
ON CONFLICT DO NOTHING;

-- Étape 2: Supprimer les order_items liés aux produits orphelins
DELETE FROM order_items
WHERE product_id IN (
  SELECT p.id FROM products p
  LEFT JOIN business_accounts ba ON ba.id = p.business_account_id
  WHERE ba.id IS NULL
);

-- Étape 3: Supprimer les produits qui n'ont pas de business_account valide
DELETE FROM products
WHERE business_account_id IS NULL
OR business_account_id NOT IN (SELECT id FROM business_accounts);

-- Étape 4: Supprimer les business_orders orphelins (si ils n'ont plus de business valide)
DELETE FROM business_orders
WHERE business_account_id NOT IN (SELECT id FROM business_accounts);

-- Étape 5: Nettoyer la table businesses maintenant que tout est migré
TRUNCATE TABLE businesses CASCADE;

-- Étape 6: Ajouter un commentaire sur la table businesses pour documenter qu'elle est dépréciée
COMMENT ON TABLE businesses IS 'DEPRECATED: Utiliser business_accounts à la place. Cette table est conservée pour compatibilité mais ne doit plus être utilisée.';

-- Étape 7: Vérification finale - Liste les business_accounts valides
-- (Cette requête ne fait rien mais permet de voir l'état final)
DO $$
BEGIN
  RAISE NOTICE 'Migration complète : Unification sur business_accounts terminée';
END $$;