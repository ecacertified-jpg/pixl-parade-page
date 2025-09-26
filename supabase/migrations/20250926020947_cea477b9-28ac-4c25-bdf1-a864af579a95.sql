-- Fix business orders for individual orders by allowing NULL fund_id

-- Make fund_id nullable for individual orders
ALTER TABLE public.business_orders 
ALTER COLUMN fund_id DROP NOT NULL;

-- Update the RLS policy to handle individual orders properly
DROP POLICY IF EXISTS "Users can create business orders" ON public.business_orders;

CREATE POLICY "Users can create business orders"
ON public.business_orders
FOR INSERT
WITH CHECK (
  -- Allow if user owns the business account
  EXISTS (
    SELECT 1 FROM public.business_accounts ba 
    WHERE ba.id = business_account_id 
    AND ba.user_id = auth.uid()
  )
  OR 
  -- Always allow for authenticated users (individual orders)
  auth.uid() IS NOT NULL
);