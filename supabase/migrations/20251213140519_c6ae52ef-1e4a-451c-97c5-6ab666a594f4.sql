-- Créer une fonction SECURITY DEFINER pour vérifier l'accès sans déclencher RLS
CREATE OR REPLACE FUNCTION public.can_access_business_fund_data(fund_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_is_public BOOLEAN;
BEGIN
  -- Récupérer les données de la cagnotte sans déclencher RLS
  SELECT creator_id, is_public INTO v_creator_id, v_is_public
  FROM public.collective_funds
  WHERE id = fund_uuid;
  
  -- Pas de cagnotte trouvée
  IF v_creator_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si l'utilisateur est le créateur
  IF v_creator_id = user_uuid THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si la cagnotte est publique
  IF v_is_public = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur est propriétaire d'un commerce lié
  IF EXISTS (
    SELECT 1 FROM public.business_collective_funds bcf
    JOIN public.business_accounts ba ON ba.id = bcf.business_id
    WHERE bcf.fund_id = fund_uuid AND ba.user_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur a contribué
  IF EXISTS (
    SELECT 1 FROM public.fund_contributions fc
    WHERE fc.fund_id = fund_uuid AND fc.contributor_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur est ami du créateur avec permission
  IF EXISTS (
    SELECT 1 FROM public.contact_relationships cr
    WHERE ((cr.user_a = v_creator_id AND cr.user_b = user_uuid)
       OR (cr.user_b = v_creator_id AND cr.user_a = user_uuid))
    AND cr.can_see_funds = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Supprimer la politique problématique qui cause encore la récursion
DROP POLICY IF EXISTS "Users can view business fund data for accessible funds" ON public.business_collective_funds;

-- Créer une nouvelle politique utilisant la fonction SECURITY DEFINER
CREATE POLICY "Users can view business fund data via security definer"
ON public.business_collective_funds
FOR SELECT
USING (
  public.can_access_business_fund_data(fund_id, auth.uid())
);