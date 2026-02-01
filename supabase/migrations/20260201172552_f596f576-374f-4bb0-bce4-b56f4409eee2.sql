-- ============================================
-- SECURITY FIX: Protect sensitive business data
-- ============================================

-- Step 1: Drop the overly permissive policy that exposes all columns
DROP POLICY IF EXISTS "Authenticated users can view active businesses" ON public.business_accounts;

-- Step 2: Recreate business_public_info view with all necessary public fields
-- This view excludes: phone, email, payment_info, user_id (sensitive data)
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
  -- Public location data for map features
  latitude,
  longitude,
  address,
  country_code,
  website_url
  -- EXCLUDED: phone, email, payment_info, user_id, deleted_at, deleted_by
FROM public.business_accounts
WHERE is_active = true 
  AND deleted_at IS NULL
  AND status = 'approved';

-- Step 3: Grant access to the view for authenticated users
GRANT SELECT ON public.business_public_info TO authenticated;
GRANT SELECT ON public.business_public_info TO anon;