-- Create function to check if user is friend with the beneficiary of a business fund
CREATE OR REPLACE FUNCTION public.can_see_business_fund_for_friend(fund_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  beneficiary_id UUID;
BEGIN
  -- Get the beneficiary_user_id from business_collective_funds
  SELECT bcf.beneficiary_user_id INTO beneficiary_id
  FROM public.business_collective_funds bcf
  WHERE bcf.fund_id = fund_uuid;
  
  IF beneficiary_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's a friendship relationship with can_see_funds = true
  RETURN EXISTS (
    SELECT 1 
    FROM public.contact_relationships cr
    WHERE (
      (cr.user_a = user_uuid AND cr.user_b = beneficiary_id)
      OR (cr.user_b = user_uuid AND cr.user_a = beneficiary_id)
    )
    AND cr.can_see_funds = true
  );
END;
$function$;

-- Update RLS policy on collective_funds to include beneficiary and their friends
DROP POLICY IF EXISTS "Users can view accessible funds" ON collective_funds;
CREATE POLICY "Users can view accessible funds" ON collective_funds FOR SELECT
USING (
  (auth.uid() = creator_id) OR 
  (is_public = true) OR 
  has_contributed_to_fund(id, auth.uid()) OR 
  can_see_fund_for_friend(id, auth.uid()) OR 
  is_beneficiary_of_surprise(id, auth.uid()) OR 
  is_surprise_contributor(id, auth.uid()) OR 
  -- Business owner can see funds linked to their products
  (EXISTS ( SELECT 1 FROM products p JOIN business_accounts ba ON p.business_account_id = ba.id WHERE p.id = collective_funds.business_product_id AND ba.user_id = auth.uid())) OR
  -- NEW: Beneficiary of a business fund can see it
  (EXISTS ( SELECT 1 FROM business_collective_funds bcf WHERE bcf.fund_id = collective_funds.id AND bcf.beneficiary_user_id = auth.uid())) OR
  -- NEW: Friends of the beneficiary can see the fund
  can_see_business_fund_for_friend(id, auth.uid())
);