-- =====================================================
-- FIX RLS RECURSION ON fund_contributions AND collective_funds
-- =====================================================

-- Step 1: Drop ALL existing policies on fund_contributions to start fresh
DROP POLICY IF EXISTS "Participants can view non-anonymous contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Users can view contributions to accessible funds" ON public.fund_contributions;
DROP POLICY IF EXISTS "Contributors can view their own contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Fund creators can view fund contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Authenticated users can create contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Users can view their own contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON public.fund_contributions;

-- Step 2: Drop problematic policy on collective_funds
DROP POLICY IF EXISTS "Contributors can view their funds" ON public.collective_funds;

-- Step 3: Create SECURITY DEFINER function to check if user has contributed to a fund
-- This avoids RLS recursion by bypassing RLS checks
CREATE OR REPLACE FUNCTION public.user_has_contributed_to_fund(p_user_id uuid, p_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fund_contributions
    WHERE contributor_id = p_user_id
    AND fund_id = p_fund_id
  );
$$;

-- Step 4: Create SECURITY DEFINER function to get fund creator
CREATE OR REPLACE FUNCTION public.get_fund_creator_id(p_fund_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT creator_id FROM collective_funds WHERE id = p_fund_id;
$$;

-- Step 5: Create SECURITY DEFINER function to check if user can access a fund
CREATE OR REPLACE FUNCTION public.user_can_access_fund(p_user_id uuid, p_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM collective_funds
    WHERE id = p_fund_id
    AND (
      creator_id = p_user_id
      OR is_public = true
      OR EXISTS (
        SELECT 1 FROM fund_contributions
        WHERE fund_id = p_fund_id
        AND contributor_id = p_user_id
      )
    )
  );
$$;

-- Step 6: Create new simplified policies on fund_contributions
-- Policy 1: Users can view their own contributions (no recursion - direct check)
CREATE POLICY "fund_contributions_select_own"
ON public.fund_contributions
FOR SELECT
USING (contributor_id = auth.uid());

-- Policy 2: Fund creators can view all contributions to their funds (uses SECURITY DEFINER)
CREATE POLICY "fund_contributions_select_creator"
ON public.fund_contributions
FOR SELECT
USING (public.get_fund_creator_id(fund_id) = auth.uid());

-- Policy 3: Contributors to a fund can see non-anonymous contributions (uses SECURITY DEFINER)
CREATE POLICY "fund_contributions_select_participants"
ON public.fund_contributions
FOR SELECT
USING (
  is_anonymous = false
  AND public.user_has_contributed_to_fund(auth.uid(), fund_id)
);

-- Policy 4: Authenticated users can create contributions
CREATE POLICY "fund_contributions_insert"
ON public.fund_contributions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND contributor_id = auth.uid()
);

-- Step 7: Create corrected policy on collective_funds for contributors
CREATE POLICY "collective_funds_select_contributors"
ON public.collective_funds
FOR SELECT
USING (public.user_has_contributed_to_fund(auth.uid(), id));

-- Grant execute on the new functions
GRANT EXECUTE ON FUNCTION public.user_has_contributed_to_fund(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fund_creator_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_fund(uuid, uuid) TO authenticated;