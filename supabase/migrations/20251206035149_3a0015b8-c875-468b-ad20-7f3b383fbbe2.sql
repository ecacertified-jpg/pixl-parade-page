-- Allow admins to view ALL business accounts (including pending/inactive)
CREATE POLICY "Admins can view all business accounts"
ON public.business_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);