-- Corriger la vue business_public_info avec le bon filtre de status
DROP VIEW IF EXISTS public.business_public_info;

CREATE VIEW public.business_public_info 
WITH (security_invoker = on) AS
SELECT 
  id,
  business_name,
  business_type,
  description,
  logo_url,
  is_active,
  is_verified,
  status,
  opening_hours,
  delivery_zones,
  delivery_settings,
  created_at,
  updated_at,
  latitude,
  longitude,
  address,
  country_code,
  website_url
FROM public.business_accounts
WHERE is_active = true 
  AND deleted_at IS NULL
  AND status = 'active';

GRANT SELECT ON public.business_public_info TO authenticated;
GRANT SELECT ON public.business_public_info TO anon;