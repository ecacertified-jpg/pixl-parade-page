-- Permettre aux admins actifs de voir tous les profils
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);