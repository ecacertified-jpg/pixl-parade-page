-- Add per-shop visibility toggles for vendor contact info
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS show_phone_publicly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email_publicly boolean NOT NULL DEFAULT false;

-- Recreate the public view to expose phone/email only when the vendor has opted in
DROP VIEW IF EXISTS public.business_public_info;

CREATE VIEW public.business_public_info AS
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
  website_url,
  CASE WHEN show_phone_publicly THEN phone ELSE NULL END AS phone,
  CASE WHEN show_email_publicly THEN email ELSE NULL END AS email,
  show_phone_publicly,
  show_email_publicly
FROM public.business_accounts
WHERE is_active = true
  AND deleted_at IS NULL
  AND status = 'active'::text;

GRANT SELECT ON public.business_public_info TO anon;
GRANT SELECT ON public.business_public_info TO authenticated;