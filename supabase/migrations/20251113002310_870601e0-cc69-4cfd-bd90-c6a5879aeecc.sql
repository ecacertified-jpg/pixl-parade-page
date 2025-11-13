-- Fix RLS policy for posts table to allow authenticated users to create posts
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;

-- Create a new INSERT policy with proper WITH CHECK clause
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure the existing SELECT policy is also correct
DROP POLICY IF EXISTS "Users can view their own posts and public posts" ON posts;

CREATE POLICY "Users can view their own posts and public posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM contact_relationships
      WHERE (user_a = auth.uid() AND user_b = posts.user_id)
      OR (user_b = auth.uid() AND user_a = posts.user_id)
    ))
  );