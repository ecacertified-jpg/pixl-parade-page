-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles table access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create helper function to check friendship (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.are_friends(user_a_id uuid, user_b_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contact_relationships
    WHERE (user_a = user_a_id AND user_b = user_b_id)
       OR (user_b = user_a_id AND user_a = user_b_id)
  )
$$;

-- Allow friends to view basic profile info
CREATE POLICY "Friends can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.are_friends(auth.uid(), user_id));

-- Create a limited public profiles view for safe public display
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  first_name,
  avatar_url,
  badges,
  created_at
FROM profiles;

-- Grant access to authenticated users on the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Users can view their own profile" ON profiles IS 'Users can only view their own full profile data';
COMMENT ON POLICY "Friends can view profiles" ON profiles IS 'Friends via contact_relationships can view each other profiles';
COMMENT ON VIEW public.public_profiles IS 'Limited public profile view with only safe fields (no phone, birthday, last_name, etc.)';