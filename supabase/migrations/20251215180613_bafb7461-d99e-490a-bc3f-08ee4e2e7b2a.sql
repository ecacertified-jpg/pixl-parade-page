-- Fix Security Definer View issue: Convert public_profiles to use RLS instead
-- This addresses the linter warning about SECURITY DEFINER views

-- Drop the security definer view
DROP VIEW IF EXISTS public_profiles;

-- Recreate as a regular view that respects RLS
CREATE VIEW public_profiles 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  first_name,
  last_name,
  bio,
  avatar_url,
  created_at,
  privacy_setting
FROM profiles
WHERE privacy_setting = 'public' 
  AND is_suspended = false;

-- The view will now use the caller's permissions
-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;