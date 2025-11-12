-- Drop the restrictive policy on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a new policy allowing authenticated users to view all profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);