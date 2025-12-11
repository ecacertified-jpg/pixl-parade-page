-- Add customer_id column to business_orders to track who placed the order
ALTER TABLE public.business_orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Allow customer orders and business management" ON public.business_orders;

-- Create a simpler, more permissive INSERT policy for authenticated customers
CREATE POLICY "Authenticated users can create orders" 
ON public.business_orders 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Keep the existing SELECT and UPDATE policies for business owners (they already exist)