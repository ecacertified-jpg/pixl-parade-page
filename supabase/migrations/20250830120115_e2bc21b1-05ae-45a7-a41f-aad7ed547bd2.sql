-- Corriger la fonction can_contribute_to_fund pour permettre aux utilisateurs authentifiés de contribuer
DROP FUNCTION IF EXISTS public.can_contribute_to_fund(uuid);

CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Permettre aux utilisateurs authentifiés de contribuer à toutes les cotisations actives
  IF auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.collective_funds 
      WHERE id = fund_uuid 
      AND status = 'active'
    );
  END IF;
  
  -- Pour les utilisateurs anonymes, vérifier le paramètre allow_anonymous_contributions
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid 
    AND is_public = true 
    AND allow_anonymous_contributions = true
    AND status = 'active'
  );
END;
$$;

-- Mettre à jour la politique RLS pour fund_contributions pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can create fund contributions for accessible funds" ON public.fund_contributions;

CREATE POLICY "Users can create fund contributions for accessible funds" 
ON public.fund_contributions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.can_contribute_to_fund(fund_id)
);