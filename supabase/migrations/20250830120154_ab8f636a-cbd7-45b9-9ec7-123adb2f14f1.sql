-- Supprimer toutes les politiques qui dépendent de la fonction can_contribute_to_fund
DROP POLICY IF EXISTS "Anonymous users can contribute to public funds" ON public.fund_contributions;
DROP POLICY IF EXISTS "Users can create fund contributions for accessible funds" ON public.fund_contributions;

-- Maintenant supprimer et recréer la fonction
DROP FUNCTION IF EXISTS public.can_contribute_to_fund(uuid) CASCADE;

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

-- Recréer la politique pour les utilisateurs authentifiés
CREATE POLICY "Users can create fund contributions" 
ON public.fund_contributions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.can_contribute_to_fund(fund_id)
);

-- Politique pour les contributions anonymes (si nécessaire)
CREATE POLICY "Anonymous users can contribute to public funds" 
ON public.fund_contributions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  public.can_contribute_to_fund(fund_id)
);