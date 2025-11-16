
-- Phase 1: Nettoyage des données de test
-- Suppression des business appartenant à l'utilisateur 3fc4a030 (Florentin)
-- qui apparaissent par erreur dans le compte de l'utilisateur 2fbdc7e0 (ecacertified)

-- 1. Supprimer les order_items liés aux produits du business "Business 3fc4a030"
DELETE FROM order_items
WHERE product_id IN (
  SELECT id FROM products 
  WHERE business_account_id = 'c78e79ab-3196-45cb-b272-fa1335b338bf'
);

-- 2. Supprimer les commandes orphelines (sans order_items)
DELETE FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items);

-- 3. Supprimer les produits du business "Business 3fc4a030"
DELETE FROM products
WHERE business_account_id = 'c78e79ab-3196-45cb-b272-fa1335b338bf';

-- 4. Supprimer les business_orders liés à ce business (si la table existe)
DELETE FROM business_orders
WHERE business_account_id = 'c78e79ab-3196-45cb-b272-fa1335b338bf';

-- 5. Supprimer le business "Business 3fc4a030"
DELETE FROM business_accounts
WHERE id = 'c78e79ab-3196-45cb-b272-fa1335b338bf';

-- 6. Supprimer le business "Eca certified" (doublon de Florentin)
DELETE FROM business_accounts
WHERE id = '9ee16cab-dfc6-42b9-8d9f-691a15ce45fb';

-- Vérification finale
SELECT 
  'Nettoyage terminé - Business restants pour user 2fbdc7e0:' as message,
  COUNT(*) as count
FROM business_accounts 
WHERE user_id = '2fbdc7e0-6ae0-47fa-8c28-d82fe5c1b9d2';
