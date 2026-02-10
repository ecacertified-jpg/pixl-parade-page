
-- 1. Corriger les données existantes : propager le country_code de business_accounts vers products
UPDATE products p
SET country_code = ba.country_code
FROM business_accounts ba
WHERE p.business_account_id = ba.id
AND p.country_code IS DISTINCT FROM ba.country_code;

-- 2. Trigger : nouveau produit hérite du country_code de sa boutique
CREATE OR REPLACE FUNCTION sync_product_country_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
    SELECT country_code INTO NEW.country_code
    FROM business_accounts
    WHERE id = NEW.business_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sync_product_country
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_country_code();

-- 3. Trigger : quand le country_code d'une boutique change, propager aux produits
CREATE OR REPLACE FUNCTION propagate_business_country_to_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country_code IS DISTINCT FROM OLD.country_code THEN
    UPDATE products
    SET country_code = NEW.country_code
    WHERE business_account_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_propagate_business_country
AFTER UPDATE OF country_code ON business_accounts
FOR EACH ROW
EXECUTE FUNCTION propagate_business_country_to_products();
