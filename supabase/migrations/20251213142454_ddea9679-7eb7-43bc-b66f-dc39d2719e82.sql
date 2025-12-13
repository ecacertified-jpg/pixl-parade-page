-- Drop the overly permissive public policy that exposes contact info
DROP POLICY IF EXISTS "Anyone can view active business accounts basic info" ON public.business_accounts;

-- Create a secure view with only non-sensitive public fields
CREATE OR REPLACE VIEW public.business_public_info AS
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

-- Grant access to the view for public browsing
GRANT SELECT ON public.business_public_info TO anon;
GRANT SELECT ON public.business_public_info TO authenticated;