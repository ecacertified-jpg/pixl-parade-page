-- Drop existing problematic policy and functions
DROP POLICY IF EXISTS "Users can view funds with friend access" ON public.collective_funds;
DROP FUNCTION IF EXISTS public.can_see_fund_for_friend(UUID, UUID);
DROP FUNCTION IF EXISTS public.has_contributed_to_fund(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_surprise_contributor(UUID, UUID);

-- Create security definer functions to prevent RLS recursion

-- Function to check if user has contributed to a fund
CREATE FUNCTION public.has_contributed_to_fund(fund_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.fund_contributions 
    WHERE fund_id = fund_uuid 
    AND contributor_id = user_uuid
  );
END;
$$;

-- Function to check if user is a surprise contributor
CREATE FUNCTION public.is_surprise_contributor(fund_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.surprise_contributors 
    WHERE fund_id = fund_uuid 
    AND contributor_id = user_uuid
  );
END;
$$;

-- Function to check if user can see fund through friend relationship
CREATE FUNCTION public.can_see_fund_for_friend(fund_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_creator_id UUID;
BEGIN
  -- Get the creator_id directly without triggering RLS on collective_funds
  SELECT creator_id INTO fund_creator_id
  FROM public.collective_funds
  WHERE id = fund_uuid;
  
  IF fund_creator_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's a relationship allowing fund visibility
  RETURN EXISTS (
    SELECT 1 
    FROM public.contact_relationships cr
    WHERE (
      (cr.user_a = user_uuid AND cr.user_b = fund_creator_id)
      OR (cr.user_b = user_uuid AND cr.user_a = fund_creator_id)
    )
    AND cr.can_see_funds = true
  );
END;
$$;

-- Create new simplified RLS policy without recursion
CREATE POLICY "Users can view accessible funds"
ON public.collective_funds
FOR SELECT
USING (
  auth.uid() = creator_id  -- Own funds
  OR is_public = true  -- Public funds
  OR has_contributed_to_fund(id, auth.uid())  -- Contributed to fund
  OR can_see_fund_for_friend(id, auth.uid())  -- Friend with access
  OR is_beneficiary_of_surprise(id, auth.uid())  -- Surprise beneficiary
  OR is_surprise_contributor(id, auth.uid())  -- Surprise contributor
);