-- Fix profiles table security: sensitive data exposure based on privacy settings
-- Problem: All columns exposed when profile is public/friends, including phone, birthday, city

-- Step 1: Drop redundant and overlapping SELECT policies
DROP POLICY IF EXISTS "Friends can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles based on privacy settings" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Step 2: Create a secure SECURITY DEFINER function to get limited profile data
-- This ensures only non-sensitive fields are returned for public/friend access
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  bio text,
  avatar_url text,
  city text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privacy text;
  requesting_user uuid;
BEGIN
  requesting_user := auth.uid();
  
  -- Get the target user's privacy setting
  SELECT p.privacy_setting INTO privacy
  FROM profiles p
  WHERE p.user_id = target_user_id;
  
  -- If user is viewing their own profile, return all fields (handled by main query)
  IF requesting_user = target_user_id THEN
    RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name, p.bio, p.avatar_url, p.city, p.created_at
    FROM profiles p
    WHERE p.user_id = target_user_id;
    RETURN;
  END IF;
  
  -- Check if user can view based on privacy setting
  IF privacy = 'public' THEN
    -- Public: return limited non-sensitive data only
    RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name, p.bio, p.avatar_url, 
           NULL::text as city, p.created_at
    FROM profiles p
    WHERE p.user_id = target_user_id;
  ELSIF privacy = 'friends' THEN
    -- Friends only: check friendship and return limited data
    IF EXISTS (
      SELECT 1 FROM contact_relationships cr
      WHERE (cr.user_a = requesting_user AND cr.user_b = target_user_id)
         OR (cr.user_a = target_user_id AND cr.user_b = requesting_user)
    ) THEN
      RETURN QUERY
      SELECT p.user_id, p.first_name, p.last_name, p.bio, p.avatar_url, 
             p.city, p.created_at
      FROM profiles p
      WHERE p.user_id = target_user_id;
    END IF;
  END IF;
  -- Private: return nothing for other users
  RETURN;
END;
$$;

-- Step 3: Create a secure view for public profile listing (minimal info)
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
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

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Step 4: Create single, consolidated SELECT policy
-- Users can ONLY view their own full profile directly
CREATE POLICY "Users can view their own profile" 
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Step 5: Add policy for limited public access (via view or function only)
-- This prevents direct access to sensitive columns via the main table
-- The public_profiles view and get_public_profile_data function handle external access

-- Step 6: Create a function for checking if user can see another's profile
CREATE OR REPLACE FUNCTION public.can_view_profile(viewer_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privacy text;
BEGIN
  -- User can always view their own profile
  IF viewer_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Get privacy setting
  SELECT privacy_setting INTO privacy
  FROM profiles
  WHERE user_id = target_user_id;
  
  -- Check based on privacy
  IF privacy = 'public' THEN
    RETURN true;
  ELSIF privacy = 'friends' THEN
    RETURN EXISTS (
      SELECT 1 FROM contact_relationships cr
      WHERE (cr.user_a = viewer_id AND cr.user_b = target_user_id)
         OR (cr.user_a = target_user_id AND cr.user_b = viewer_id)
    );
  END IF;
  
  -- Private: only owner can view
  RETURN false;
END;
$$;