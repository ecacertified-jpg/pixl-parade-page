-- 1) Add columns to business_accounts
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS setup_tier text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS setup_completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

-- Constrain setup_tier values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_accounts_setup_tier_check'
  ) THEN
    ALTER TABLE public.business_accounts
      ADD CONSTRAINT business_accounts_setup_tier_check
      CHECK (setup_tier IN ('none','bronze','silver','gold'));
  END IF;
END $$;

-- 2) Function to compute tier
CREATE OR REPLACE FUNCTION public.compute_business_setup_tier(_business_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
  product_count int;
  has_profile boolean;
  has_delivery boolean;
  has_payment boolean;
  computed text := 'none';
BEGIN
  SELECT description, logo_url, delivery_zones, payment_info
    INTO b
    FROM public.business_accounts
   WHERE id = _business_id;

  IF NOT FOUND THEN
    RETURN 'none';
  END IF;

  SELECT COUNT(*) INTO product_count
    FROM public.products
   WHERE business_id = _business_id;

  has_profile := (b.logo_url IS NOT NULL AND b.logo_url <> '')
                 AND (b.description IS NOT NULL AND length(b.description) > 10);

  has_delivery := (b.delivery_zones IS NOT NULL
                   AND jsonb_typeof(b.delivery_zones) = 'array'
                   AND jsonb_array_length(b.delivery_zones) > 0);

  has_payment := (b.payment_info IS NOT NULL
                  AND (b.payment_info ? 'mobile_money')
                  AND COALESCE(b.payment_info->>'mobile_money','') <> '');

  -- Bronze: profile + at least 1 product
  IF has_profile AND product_count >= 1 THEN
    computed := 'bronze';
  END IF;

  -- Silver: + delivery + payment + 3 products
  IF computed = 'bronze' AND has_delivery AND has_payment AND product_count >= 3 THEN
    computed := 'silver';
  END IF;

  -- Gold: silver + 5 products (notifications/share are client-side flags)
  IF computed = 'silver' AND product_count >= 5 THEN
    computed := 'gold';
  END IF;

  RETURN computed;
END;
$$;

-- 3) Trigger function to refresh tier on business_accounts changes
CREATE OR REPLACE FUNCTION public.trg_refresh_business_setup_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tier text;
BEGIN
  new_tier := public.compute_business_setup_tier(NEW.id);
  IF new_tier IS DISTINCT FROM NEW.setup_tier THEN
    NEW.setup_tier := new_tier;
    IF new_tier = 'gold' AND NEW.setup_completed_at IS NULL THEN
      NEW.setup_completed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_accounts_setup_tier ON public.business_accounts;
CREATE TRIGGER trg_business_accounts_setup_tier
BEFORE INSERT OR UPDATE OF description, logo_url, delivery_zones, payment_info, setup_tier
ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_business_setup_tier();

-- 4) Trigger function to refresh tier when products change
CREATE OR REPLACE FUNCTION public.trg_products_refresh_business_setup_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bid uuid;
  new_tier text;
  old_tier text;
BEGIN
  bid := COALESCE(NEW.business_id, OLD.business_id);
  IF bid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  new_tier := public.compute_business_setup_tier(bid);

  SELECT setup_tier INTO old_tier FROM public.business_accounts WHERE id = bid;

  IF new_tier IS DISTINCT FROM old_tier THEN
    UPDATE public.business_accounts
       SET setup_tier = new_tier,
           setup_completed_at = CASE
             WHEN new_tier = 'gold' AND setup_completed_at IS NULL THEN now()
             ELSE setup_completed_at
           END
     WHERE id = bid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_products_setup_tier ON public.products;
CREATE TRIGGER trg_products_setup_tier
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_products_refresh_business_setup_tier();

-- 5) Backfill current tier for existing businesses
UPDATE public.business_accounts
   SET setup_tier = public.compute_business_setup_tier(id);
