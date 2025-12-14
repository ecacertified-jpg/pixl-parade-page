-- Allow authenticated users to view basic profile information of all users
-- This is necessary for social features like seeing post authors, comments, etc.

CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);