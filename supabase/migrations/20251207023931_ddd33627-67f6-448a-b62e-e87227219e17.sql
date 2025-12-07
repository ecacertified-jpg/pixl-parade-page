-- Mettre à jour la fonction user_can_see_fund pour inclure l'accès des propriétaires de business
CREATE OR REPLACE FUNCTION public.user_can_see_fund(fund_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Permettre à l'utilisateur de voir ses propres cotisations
  IF EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid AND creator_id = user_uuid
  ) THEN
    RETURN true;
  END IF;

  -- Permettre de voir les cotisations publiques
  IF EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid AND is_public = true
  ) THEN
    RETURN true;
  END IF;

  -- Permettre aux contributeurs de voir les cotisations
  IF EXISTS (
    SELECT 1 FROM public.fund_contributions fc
    WHERE fc.fund_id = fund_uuid AND fc.contributor_id = user_uuid
  ) THEN
    RETURN true;
  END IF;

  -- Permettre aux propriétaires de business de voir les cotisations pour leurs produits
  IF EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.products p ON cf.business_product_id = p.id
    JOIN public.business_accounts ba ON p.business_account_id = ba.id
    WHERE cf.id = fund_uuid AND ba.user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;

  -- Permettre de voir les cotisations des amis avec permission
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.contact_relationships cr ON 
      (cf.creator_id = cr.user_a AND cr.user_b = user_uuid) OR
      (cf.creator_id = cr.user_b AND cr.user_a = user_uuid)
    WHERE cf.id = fund_uuid 
    AND cr.can_see_funds = true
  );
END;
$function$;

-- Mettre à jour la politique RLS sur collective_funds pour les propriétaires de business
DROP POLICY IF EXISTS "Users can view accessible funds" ON collective_funds;

CREATE POLICY "Users can view accessible funds" ON collective_funds
FOR SELECT USING (
  auth.uid() = creator_id 
  OR is_public = true 
  OR has_contributed_to_fund(id, auth.uid()) 
  OR can_see_fund_for_friend(id, auth.uid()) 
  OR is_beneficiary_of_surprise(id, auth.uid()) 
  OR is_surprise_contributor(id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM products p
    JOIN business_accounts ba ON p.business_account_id = ba.id
    WHERE p.id = collective_funds.business_product_id
    AND ba.user_id = auth.uid()
  )
);

-- Mettre à jour la politique RLS sur collective_fund_orders pour les propriétaires de business
DROP POLICY IF EXISTS "Users can view orders for funds they can access" ON collective_fund_orders;

CREATE POLICY "Users can view orders for funds they can access" ON collective_fund_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM collective_funds cf
    WHERE cf.id = collective_fund_orders.fund_id 
    AND user_can_see_fund(cf.id, auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM collective_funds cf
    JOIN products p ON cf.business_product_id = p.id
    JOIN business_accounts ba ON p.business_account_id = ba.id
    WHERE cf.id = collective_fund_orders.fund_id
    AND ba.user_id = auth.uid()
  )
);