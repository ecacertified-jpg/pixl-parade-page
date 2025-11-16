-- Suppression des produits qui n'appartiennent pas au business "Eca certified"
-- Supprimer toutes les références en cascade

-- 1. Supprimer les références dans order_items
DELETE FROM order_items
WHERE product_id IN (
  SELECT id FROM products 
  WHERE business_account_id NOT IN (
    '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20',
    '3179790d-ec3f-4b56-be92-20a74e91481a'
  )
);

-- 2. Mettre à NULL les références dans collective_funds
UPDATE collective_funds
SET business_product_id = NULL
WHERE business_product_id IN (
  SELECT id FROM products 
  WHERE business_account_id NOT IN (
    '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20',
    '3179790d-ec3f-4b56-be92-20a74e91481a'
  )
);

-- 3. Supprimer les références dans favorites
DELETE FROM favorites
WHERE product_id IN (
  SELECT id FROM products 
  WHERE business_account_id NOT IN (
    '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20',
    '3179790d-ec3f-4b56-be92-20a74e91481a'
  )
);

-- 4. Mettre à NULL les références dans gifts
UPDATE gifts
SET product_id = NULL
WHERE product_id IN (
  SELECT id FROM products 
  WHERE business_account_id NOT IN (
    '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20',
    '3179790d-ec3f-4b56-be92-20a74e91481a'
  )
);

-- 5. Enfin, supprimer les produits
DELETE FROM products 
WHERE business_account_id NOT IN (
  '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20',
  '3179790d-ec3f-4b56-be92-20a74e91481a'
);