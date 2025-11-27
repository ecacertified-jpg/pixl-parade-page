-- Allow all authenticated users to view platform settings for display purposes
-- This is needed so business owners can see dynamic values like commission rates
-- Only super_admins can modify these settings (existing policies remain)

CREATE POLICY "Authenticated users can view platform settings"
ON platform_settings
FOR SELECT
TO authenticated
USING (true);