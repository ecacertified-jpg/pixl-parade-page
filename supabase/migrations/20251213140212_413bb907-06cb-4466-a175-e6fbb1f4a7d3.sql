-- Supprimer la politique problématique qui cause la récursion infinie
DROP POLICY IF EXISTS "Users who can see fund can see business fund data" ON public.business_collective_funds;

-- Créer une nouvelle politique sans récursion
-- Cette politique vérifie directement les conditions d'accès sans créer de boucle
CREATE POLICY "Users can view business fund data for accessible funds"
ON public.business_collective_funds
FOR SELECT
USING (
  -- Propriétaire du commerce
  EXISTS (
    SELECT 1 FROM business_accounts ba
    WHERE ba.id = business_collective_funds.business_id AND ba.user_id = auth.uid()
  )
  -- OU Créateur de la cagnotte
  OR EXISTS (
    SELECT 1 FROM collective_funds cf
    WHERE cf.id = business_collective_funds.fund_id 
    AND cf.creator_id = auth.uid()
  )
  -- OU Contributeur à la cagnotte
  OR EXISTS (
    SELECT 1 FROM fund_contributions fc
    WHERE fc.fund_id = business_collective_funds.fund_id 
    AND fc.contributor_id = auth.uid()
  )
  -- OU Ami du créateur de la cagnotte
  OR EXISTS (
    SELECT 1 FROM collective_funds cf
    JOIN contact_relationships cr ON (
      (cr.user_a = cf.creator_id AND cr.user_b = auth.uid())
      OR (cr.user_b = cf.creator_id AND cr.user_a = auth.uid())
    )
    WHERE cf.id = business_collective_funds.fund_id
  )
  -- OU Cagnotte publique
  OR EXISTS (
    SELECT 1 FROM collective_funds cf
    WHERE cf.id = business_collective_funds.fund_id 
    AND cf.is_public = true
  )
);