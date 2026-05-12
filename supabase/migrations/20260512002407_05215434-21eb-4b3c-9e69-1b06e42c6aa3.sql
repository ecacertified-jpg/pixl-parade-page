
-- 1) Create business_payment_info
CREATE TABLE IF NOT EXISTS public.business_payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id uuid NOT NULL UNIQUE REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  wave_merchant_phone text,
  mobile_money_merchant_phone text,
  wave_payment_link text,
  payment_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their business payment info"
ON public.business_payment_info FOR SELECT
USING (EXISTS (SELECT 1 FROM public.business_accounts ba WHERE ba.id = business_payment_info.business_account_id AND ba.user_id = auth.uid()));

CREATE POLICY "Owners can insert their business payment info"
ON public.business_payment_info FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.business_accounts ba WHERE ba.id = business_payment_info.business_account_id AND ba.user_id = auth.uid()));

CREATE POLICY "Owners can update their business payment info"
ON public.business_payment_info FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.business_accounts ba WHERE ba.id = business_payment_info.business_account_id AND ba.user_id = auth.uid()));

CREATE POLICY "Owners can delete their business payment info"
ON public.business_payment_info FOR DELETE
USING (EXISTS (SELECT 1 FROM public.business_accounts ba WHERE ba.id = business_payment_info.business_account_id AND ba.user_id = auth.uid()));

CREATE POLICY "Admins can manage business payment info"
ON public.business_payment_info FOR ALL
USING (public.is_active_admin(auth.uid()))
WITH CHECK (public.is_active_admin(auth.uid()));

CREATE TRIGGER update_business_payment_info_updated_at
BEFORE UPDATE ON public.business_payment_info
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS validate_business_payment_info ON public.business_accounts;
CREATE TRIGGER validate_business_payment_info
BEFORE INSERT OR UPDATE ON public.business_payment_info
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_info();

-- 2) Migrate existing data
INSERT INTO public.business_payment_info (business_account_id, wave_merchant_phone, mobile_money_merchant_phone, wave_payment_link, payment_info)
SELECT id, wave_merchant_phone, mobile_money_merchant_phone, wave_payment_link, COALESCE(payment_info, '{}'::jsonb)
FROM public.business_accounts
WHERE wave_merchant_phone IS NOT NULL OR mobile_money_merchant_phone IS NOT NULL
   OR wave_payment_link IS NOT NULL OR (payment_info IS NOT NULL AND payment_info <> '{}'::jsonb)
ON CONFLICT (business_account_id) DO NOTHING;

-- 3) Update compute_business_setup_tier to use new table
CREATE OR REPLACE FUNCTION public.compute_business_setup_tier(_business_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  b record; pinfo jsonb; product_count int;
  has_profile boolean; has_delivery boolean; has_payment boolean;
  computed text := 'none';
BEGIN
  SELECT description, logo_url, delivery_zones INTO b FROM public.business_accounts WHERE id = _business_id;
  IF NOT FOUND THEN RETURN 'none'; END IF;
  SELECT payment_info INTO pinfo FROM public.business_payment_info WHERE business_account_id = _business_id;
  SELECT COUNT(*) INTO product_count FROM public.products WHERE business_id = _business_id;
  has_profile := (b.logo_url IS NOT NULL AND b.logo_url <> '') AND (b.description IS NOT NULL AND length(b.description) > 10);
  has_delivery := (b.delivery_zones IS NOT NULL AND jsonb_typeof(b.delivery_zones) = 'array' AND jsonb_array_length(b.delivery_zones) > 0);
  has_payment := (pinfo IS NOT NULL AND (pinfo ? 'mobile_money') AND COALESCE(pinfo->>'mobile_money','') <> '');
  IF has_profile AND product_count >= 1 THEN computed := 'bronze'; END IF;
  IF computed = 'bronze' AND has_delivery AND has_payment AND product_count >= 3 THEN computed := 'silver'; END IF;
  IF computed = 'silver' AND product_count >= 5 THEN computed := 'gold'; END IF;
  RETURN computed;
END;
$function$;

-- 4) Drop dependent objects then drop columns then recreate
DROP VIEW IF EXISTS public.deleted_businesses_with_admin;
DROP TRIGGER IF EXISTS trg_business_accounts_setup_tier ON public.business_accounts;

ALTER TABLE public.business_accounts
  DROP COLUMN IF EXISTS wave_merchant_phone,
  DROP COLUMN IF EXISTS mobile_money_merchant_phone,
  DROP COLUMN IF EXISTS wave_payment_link,
  DROP COLUMN IF EXISTS payment_info;

-- Recreate the setup tier trigger
CREATE TRIGGER trg_business_accounts_setup_tier
BEFORE INSERT OR UPDATE ON public.business_accounts
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_business_setup_tier();

-- Recreate deleted_businesses_with_admin view (without payment_info)
CREATE VIEW public.deleted_businesses_with_admin AS
SELECT ba.id, ba.user_id, ba.business_name, ba.business_type, ba.phone, ba.address,
       ba.is_verified, ba.is_active, ba.created_at, ba.updated_at,
       ba.opening_hours, ba.delivery_zones, ba.delivery_settings,
       ba.description, ba.logo_url, ba.website_url, ba.email,
       ba.rejection_reason, ba.rejection_date, ba.resubmission_count, ba.corrections_message,
       ba.status, ba.deleted_at, ba.deleted_by,
       p.first_name AS deleted_by_first_name, p.last_name AS deleted_by_last_name,
       dba.archived_data, dba.expires_at,
       GREATEST(0::numeric, EXTRACT(day FROM dba.expires_at - now())) AS days_remaining
FROM public.business_accounts ba
LEFT JOIN public.profiles p ON ba.deleted_by = p.user_id
LEFT JOIN public.deleted_business_archives dba ON ba.id = dba.business_id
WHERE ba.deleted_at IS NOT NULL;

-- 5) Update get_business_account (no payment_info)
DROP FUNCTION IF EXISTS public.get_business_account(uuid);
CREATE OR REPLACE FUNCTION public.get_business_account(p_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, business_name text, business_type text, phone text, address text, description text, logo_url text, website_url text, email text, opening_hours jsonb, delivery_zones jsonb, delivery_settings jsonb, is_verified boolean, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: Can only view own business account'; END IF;
  RETURN QUERY
  SELECT ba.id, ba.user_id, ba.business_name, ba.business_type, ba.phone, ba.address,
         ba.description, ba.logo_url, ba.website_url, ba.email,
         ba.opening_hours, ba.delivery_zones, ba.delivery_settings,
         ba.is_verified, ba.is_active, ba.created_at, ba.updated_at
  FROM public.business_accounts ba WHERE ba.user_id = p_user_id;
END;
$function$;

-- 6) Update upsert_business_account (no p_payment_info)
DROP FUNCTION IF EXISTS public.upsert_business_account(uuid, text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb);
CREATE OR REPLACE FUNCTION public.upsert_business_account(
  p_user_id uuid, p_business_name text,
  p_business_type text DEFAULT NULL, p_phone text DEFAULT NULL, p_address text DEFAULT NULL,
  p_description text DEFAULT NULL, p_logo_url text DEFAULT NULL, p_website_url text DEFAULT NULL,
  p_email text DEFAULT NULL, p_opening_hours jsonb DEFAULT '{}'::jsonb,
  p_delivery_zones jsonb DEFAULT '[]'::jsonb, p_delivery_settings jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE business_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: Can only modify own business account'; END IF;
  INSERT INTO public.business_accounts (
    user_id, business_name, business_type, phone, address, description,
    logo_url, website_url, email, opening_hours, delivery_zones, delivery_settings
  ) VALUES (
    p_user_id, p_business_name, p_business_type, p_phone, p_address, p_description,
    p_logo_url, p_website_url, p_email, p_opening_hours, p_delivery_zones, p_delivery_settings
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    business_name = EXCLUDED.business_name, business_type = EXCLUDED.business_type,
    phone = EXCLUDED.phone, address = EXCLUDED.address, description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url, website_url = EXCLUDED.website_url, email = EXCLUDED.email,
    opening_hours = EXCLUDED.opening_hours, delivery_zones = EXCLUDED.delivery_zones,
    delivery_settings = EXCLUDED.delivery_settings, updated_at = now()
  RETURNING id INTO business_id;
  RETURN business_id;
END;
$function$;

-- 7) Owner-only RPC for payment info upsert
CREATE OR REPLACE FUNCTION public.upsert_business_payment_info(
  p_business_account_id uuid,
  p_wave_merchant_phone text DEFAULT NULL,
  p_mobile_money_merchant_phone text DEFAULT NULL,
  p_wave_payment_link text DEFAULT NULL,
  p_payment_info jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_id uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.business_accounts WHERE id = p_business_account_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Business account not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_active_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO public.business_payment_info (
    business_account_id, wave_merchant_phone, mobile_money_merchant_phone, wave_payment_link, payment_info
  ) VALUES (
    p_business_account_id, p_wave_merchant_phone, p_mobile_money_merchant_phone, p_wave_payment_link, COALESCE(p_payment_info, '{}'::jsonb)
  )
  ON CONFLICT (business_account_id) DO UPDATE SET
    wave_merchant_phone = EXCLUDED.wave_merchant_phone,
    mobile_money_merchant_phone = EXCLUDED.mobile_money_merchant_phone,
    wave_payment_link = EXCLUDED.wave_payment_link,
    payment_info = EXCLUDED.payment_info,
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
