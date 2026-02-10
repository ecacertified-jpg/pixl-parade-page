

# Corriger le drapeau pays sur les produits de "Ese Shop"

## Probleme

Le produit "Tricotage" a `country_code = 'CI'` dans la table `products`, alors que la boutique "Ese Shop" a bien `country_code = 'BJ'`. Dans `Shop.tsx`, le code donne la priorite au `country_code` du produit sur celui de la boutique (ligne 296), ce qui affiche le mauvais drapeau.

## Solution

### 1. Correction des donnees (migration SQL)

Propager le `country_code` correct de `business_accounts` vers tous les `products` qui ont un code pays different de leur boutique parente :

```sql
UPDATE products p
SET country_code = ba.country_code
FROM business_accounts ba
WHERE p.business_account_id = ba.id
AND p.country_code != ba.country_code;
```

### 2. Prevention future - Trigger de synchronisation

Creer un trigger pour que tout nouveau produit ou mise a jour de `business_accounts.country_code` propage automatiquement le bon code pays aux produits :

```sql
-- Quand un produit est insere sans country_code, il herite de sa boutique
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_product_country
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_country_code();

-- Quand le country_code d'une boutique change, propager aux produits
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propagate_business_country
AFTER UPDATE OF country_code ON business_accounts
FOR EACH ROW
EXECUTE FUNCTION propagate_business_country_to_products();
```

### 3. Aucun changement de code frontend necessaire

La logique dans `Shop.tsx` (priorite produit > boutique) et `useVendorProducts.ts` (fallback intelligent) sont correctes. Le probleme est purement dans les donnees.

### Impact

- 1 migration SQL (correction + triggers de prevention)
- 0 fichiers de code modifies
- Tous les produits de toutes les boutiques afficheront immediatement le bon drapeau
