-- Ajouter une politique RLS pour permettre aux admins de mettre à jour les comptes business
CREATE POLICY "Admins can update business accounts" 
ON public.business_accounts
FOR UPDATE
USING (
  public.is_active_admin(auth.uid())
);