-- Politique pour permettre la lecture publique des boutiques actives
CREATE POLICY "Public can view active businesses" 
ON public.business_accounts 
FOR SELECT 
TO public
USING (
  is_active = true 
  AND status = 'active' 
  AND deleted_at IS NULL
);