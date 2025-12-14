-- Allow anyone to view active business accounts (public marketplace info)
-- This enables the Shop page to display vendor names correctly

CREATE POLICY "Anyone can view active business public info"
ON business_accounts
FOR SELECT
USING (is_active = true);