-- Étendre la table business_accounts avec les champs manquants
ALTER TABLE public.business_accounts 
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_zones JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Créer une fonction pour upsert les informations business
CREATE OR REPLACE FUNCTION public.upsert_business_account(
  p_user_id UUID,
  p_business_name TEXT,
  p_business_type TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_website_url TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_opening_hours JSONB DEFAULT '{}',
  p_delivery_zones JSONB DEFAULT '[]',
  p_payment_info JSONB DEFAULT '{}',
  p_delivery_settings JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  business_id UUID;
BEGIN
  -- Vérifier que l'utilisateur ne modifie que son propre compte
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only modify own business account';
  END IF;

  -- Upsert (insert ou update) le compte business
  INSERT INTO public.business_accounts (
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
    delivery_settings
  ) VALUES (
    p_user_id,
    p_business_name,
    p_business_type,
    p_phone,
    p_address,
    p_description,
    p_logo_url,
    p_website_url,
    p_email,
    p_opening_hours,
    p_delivery_zones,
    p_payment_info,
    p_delivery_settings
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    business_name = EXCLUDED.business_name,
    business_type = EXCLUDED.business_type,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    website_url = EXCLUDED.website_url,
    email = EXCLUDED.email,
    opening_hours = EXCLUDED.opening_hours,
    delivery_zones = EXCLUDED.delivery_zones,
    payment_info = EXCLUDED.payment_info,
    delivery_settings = EXCLUDED.delivery_settings,
    updated_at = now()
  RETURNING id INTO business_id;

  RETURN business_id;
END;
$function$;

-- Créer une fonction pour récupérer les informations business
CREATE OR REPLACE FUNCTION public.get_business_account(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  business_name TEXT,
  business_type TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  email TEXT,
  opening_hours JSONB,
  delivery_zones JSONB,
  payment_info JSONB,
  delivery_settings JSONB,
  is_verified BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier que l'utilisateur ne consulte que son propre compte
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own business account';
  END IF;

  RETURN QUERY
  SELECT 
    ba.id,
    ba.user_id,
    ba.business_name,
    ba.business_type,
    ba.phone,
    ba.address,
    ba.description,
    ba.logo_url,
    ba.website_url,
    ba.email,
    ba.opening_hours,
    ba.delivery_zones,
    ba.payment_info,
    ba.delivery_settings,
    ba.is_verified,
    ba.is_active,
    ba.created_at,
    ba.updated_at
  FROM public.business_accounts ba
  WHERE ba.user_id = p_user_id;
END;
$function$;