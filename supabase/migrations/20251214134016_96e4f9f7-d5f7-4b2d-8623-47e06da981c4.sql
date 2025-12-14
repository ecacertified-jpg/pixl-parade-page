-- Add privacy setting column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_setting text NOT NULL DEFAULT 'public' 
CHECK (privacy_setting IN ('public', 'friends', 'private'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.privacy_setting IS 'Profile visibility: public (everyone), friends (contacts only), private (self only)';

-- Drop the existing permissive policy that allows all authenticated users to see all profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Create a security definer function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_users_friends(user_a_id uuid, user_b_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contact_relationships cr
    WHERE (cr.user_a = user_a_id AND cr.user_b = user_b_id)
       OR (cr.user_a = user_b_id AND cr.user_b = user_a_id)
  )
$$;

-- Create a security definer function to get a user's privacy setting
CREATE OR REPLACE FUNCTION public.get_profile_privacy(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(privacy_setting, 'public') FROM profiles WHERE user_id = target_user_id
$$;

-- Create new RLS policy that respects privacy settings
CREATE POLICY "Users can view profiles based on privacy settings"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- User can always see their own profile
  auth.uid() = user_id
  OR
  -- Public profiles are visible to all authenticated users
  privacy_setting = 'public'
  OR
  -- Friends-only profiles are visible to friends
  (privacy_setting = 'friends' AND public.are_users_friends(auth.uid(), user_id))
);