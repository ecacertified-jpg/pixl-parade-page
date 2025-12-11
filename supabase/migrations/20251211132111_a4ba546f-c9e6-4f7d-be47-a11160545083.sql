-- Fix the SECURITY DEFINER view warning by using SECURITY INVOKER
-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  first_name,
  avatar_url,
  badges,
  created_at
FROM profiles;

-- Grant access to authenticated users on the view
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS 'Limited public profile view with only safe fields. Uses SECURITY INVOKER to respect RLS.';