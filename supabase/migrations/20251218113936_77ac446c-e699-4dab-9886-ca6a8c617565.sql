-- Step 1: Create SECURITY DEFINER function to check if user is business owner of a fund
CREATE OR REPLACE FUNCTION public.is_business_owner_of_fund(p_fund_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM collective_funds cf
    JOIN products p ON cf.business_product_id = p.id
    JOIN business_accounts ba ON p.business_owner_id = ba.id
    WHERE cf.id = p_fund_id 
    AND ba.user_id = p_user_id
  )
$$;

-- Step 2: Create SECURITY DEFINER function to check if user is business owner of a fund order
CREATE OR REPLACE FUNCTION public.is_business_owner_of_fund_order(p_order_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM collective_fund_orders cfo
    JOIN collective_funds cf ON cfo.fund_id = cf.id
    JOIN products p ON cf.business_product_id = p.id
    JOIN business_accounts ba ON p.business_owner_id = ba.id
    WHERE cfo.id = p_order_id 
    AND ba.user_id = p_user_id
  )
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_business_owner_of_fund(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner_of_fund_order(UUID, UUID) TO authenticated;

-- Step 3: Drop existing problematic policies on collective_funds
DROP POLICY IF EXISTS "Business owners can view funds for their products" ON collective_funds;

-- Step 4: Create new policy using SECURITY DEFINER function
CREATE POLICY "Business owners can view funds for their products"
ON collective_funds
FOR SELECT
USING (
  public.is_business_owner_of_fund(id, auth.uid())
);

-- Step 5: Drop existing problematic policies on collective_fund_orders
DROP POLICY IF EXISTS "Business owners can view orders for their products" ON collective_fund_orders;

-- Step 6: Create new policy using SECURITY DEFINER function
CREATE POLICY "Business owners can view orders for their products"
ON collective_fund_orders
FOR SELECT
USING (
  public.is_business_owner_of_fund_order(id, auth.uid())
);

-- Step 7: Add policy on products for business owners to see ALL their products (active and inactive)
DROP POLICY IF EXISTS "Business owners can view all their products" ON products;

CREATE POLICY "Business owners can view all their products"
ON products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_accounts ba 
    WHERE ba.id = products.business_owner_id 
    AND ba.user_id = auth.uid()
  )
);