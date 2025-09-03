-- Vérifier et corriger les politiques RLS pour collective_funds
-- D'abord, supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can create funds" ON public.collective_funds;
DROP POLICY IF EXISTS "Users can view accessible funds" ON public.collective_funds;

-- Recréer la politique d'insertion avec une vérification plus robuste
CREATE POLICY "Users can create funds" 
ON public.collective_funds 
FOR INSERT 
WITH CHECK (
  -- Vérifier que l'utilisateur est authentifié et que creator_id correspond
  auth.uid() IS NOT NULL AND auth.uid() = creator_id
);

-- Recréer la politique de sélection
CREATE POLICY "Users can view accessible funds" 
ON public.collective_funds 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres fonds
  auth.uid() = creator_id 
  OR 
  -- Ou les fonds publics
  is_public = true
  OR 
  -- Ou les fonds où il a contribué
  EXISTS (
    SELECT 1 FROM public.fund_contributions fc 
    WHERE fc.fund_id = collective_funds.id 
    AND fc.contributor_id = auth.uid()
  )
  OR
  -- Ou les fonds de ses contacts avec permission
  EXISTS (
    SELECT 1 FROM public.contact_relationships cr 
    WHERE (
      (cr.user_a = auth.uid() AND cr.user_b = creator_id) OR
      (cr.user_b = auth.uid() AND cr.user_a = creator_id)
    )
    AND cr.can_see_funds = true
  )
);

-- S'assurer qu'il n'y a pas de conflit avec la fonction user_can_see_fund
-- En créant une politique alternative si nécessaire
CREATE POLICY "Alternative fund access policy" 
ON public.collective_funds 
FOR SELECT 
USING (user_can_see_fund(id, auth.uid()));