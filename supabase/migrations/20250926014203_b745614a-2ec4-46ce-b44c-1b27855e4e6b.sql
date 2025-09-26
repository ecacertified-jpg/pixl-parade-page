-- Add INSERT policy for business_orders table to allow order creation
CREATE POLICY "Users can create business orders" 
ON public.business_orders 
FOR INSERT 
WITH CHECK (true);

-- This policy allows anyone to create business orders, which is needed for individual orders
-- The security is handled at the application level through proper user authentication