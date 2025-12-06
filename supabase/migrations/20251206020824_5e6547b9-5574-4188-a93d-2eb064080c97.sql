-- Add RLS policy for admins to delete business accounts
CREATE POLICY "Admins can delete business accounts"
ON public.business_accounts
FOR DELETE
TO authenticated
USING (is_active_admin(auth.uid()));