-- Recreate view with security invoker to avoid security definer issues
DROP VIEW IF EXISTS public.business_public_info;

CREATE VIEW public.business_public_info 
WITH (security_invoker = true) AS
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
  created_at
FROM public.business_accounts
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.business_public_info TO anon;
GRANT SELECT ON public.business_public_info TO authenticated;