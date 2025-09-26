-- Update RLS policy to allow customers to create business orders for any business when making individual purchases

DROP POLICY IF EXISTS "Users can create business orders" ON public.business_orders;

CREATE POLICY "Users can create business orders"
ON public.business_orders
FOR INSERT
WITH CHECK (
  -- Allow authenticated users to create business orders for individual purchases (fund_id IS NULL)
  (auth.uid() IS NOT NULL AND fund_id IS NULL)
  OR
  -- Allow business owners to create orders for their own business
  EXISTS (
    SELECT 1 FROM public.business_accounts ba 
    WHERE ba.id = business_account_id 
    AND ba.user_id = auth.uid()
  )
);