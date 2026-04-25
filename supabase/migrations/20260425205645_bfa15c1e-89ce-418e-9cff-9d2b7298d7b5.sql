-- 1) Corrige les produits incohérents (héritent du pays de la boutique)
UPDATE public.products p
SET country_code = b.country_code
FROM public.business_accounts b
WHERE p.business_id = b.id
  AND p.country_code IS DISTINCT FROM b.country_code;

-- 2) Fonction : force le country_code d'un produit à celui de sa boutique
CREATE OR REPLACE FUNCTION public.sync_product_country()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_country text;
BEGIN
  IF NEW.business_id IS NOT NULL THEN
    SELECT country_code INTO v_business_country
    FROM public.business_accounts
    WHERE id = NEW.business_id;

    IF v_business_country IS NOT NULL THEN
      NEW.country_code := v_business_country;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Fonction : propage le changement de country_code d'une boutique à ses produits
CREATE OR REPLACE FUNCTION public.sync_business_country_to_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.country_code IS DISTINCT FROM OLD.country_code AND NEW.country_code IS NOT NULL THEN
    UPDATE public.products
    SET country_code = NEW.country_code
    WHERE business_id = NEW.id
      AND country_code IS DISTINCT FROM NEW.country_code;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Triggers
DROP TRIGGER IF EXISTS trg_sync_product_country ON public.products;
CREATE TRIGGER trg_sync_product_country
BEFORE INSERT OR UPDATE OF business_id, country_code ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_country();

DROP TRIGGER IF EXISTS trg_sync_business_country_to_products ON public.business_accounts;
CREATE TRIGGER trg_sync_business_country_to_products
AFTER UPDATE OF country_code ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.sync_business_country_to_products();