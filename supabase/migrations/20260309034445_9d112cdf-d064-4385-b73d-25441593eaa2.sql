-- Drop existing admin policy first, then recreate
DROP POLICY IF EXISTS "Admins can view notification analytics" ON public.notification_analytics;

CREATE POLICY "Admins can view notification analytics"
ON public.notification_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Allow users to see only their own notification analytics
DROP POLICY IF EXISTS "Users can view own notification analytics" ON public.notification_analytics;

CREATE POLICY "Users can view own notification analytics"
ON public.notification_analytics
FOR SELECT
TO authenticated
USING (user_id = auth.uid());