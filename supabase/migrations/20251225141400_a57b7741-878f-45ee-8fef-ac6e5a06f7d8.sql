-- Allow any authenticated user to read their own admin_users row
-- This enables moderators and other admin roles to authenticate via /admin-auth
CREATE POLICY "Admins can view own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);