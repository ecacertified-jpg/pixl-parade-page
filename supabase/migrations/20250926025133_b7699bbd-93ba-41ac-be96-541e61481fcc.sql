-- Fix RLS policies for business_orders to allow customers to order from any business
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create business orders" ON public.business_orders;

-- Create new policy that allows:
-- 1. Any authenticated user to create individual orders (fund_id IS NULL)
-- 2. Business owners to create orders for their own business
-- 3. Users to create collective fund orders they have access to
CREATE POLICY "Allow customer orders and business management" 
ON public.business_orders 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create individual orders (customer orders)
  (auth.uid() IS NOT NULL AND fund_id IS NULL) 
  OR 
  -- Allow business owners to create orders for their own business
  (EXISTS ( 
    SELECT 1 FROM business_accounts ba 
    WHERE ba.id = business_orders.business_account_id 
    AND ba.user_id = auth.uid()
  ))
  OR
  -- Allow fund creators to create orders from collective funds they own
  (fund_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM collective_funds cf 
    WHERE cf.id = business_orders.fund_id 
    AND cf.creator_id = auth.uid()
  ))
);