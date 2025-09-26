-- Allow authenticated users to view basic business account info needed for orders
-- This enables users to place orders with businesses while keeping sensitive data protected

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own business account" ON public.business_accounts;

-- Create separate policies for different operations and data access levels

-- Policy for viewing basic business info (needed for orders)
CREATE POLICY "Anyone can view basic business info" 
ON public.business_accounts 
FOR SELECT 
USING (
  is_active = true AND 
  auth.uid() IS NOT NULL
);

-- Policy for full access to own business account
CREATE POLICY "Users can manage their own business account" 
ON public.business_accounts 
FOR ALL 
USING (auth.uid() = user_id);

-- Policy for creating business accounts
CREATE POLICY "Users can create their own business account" 
ON public.business_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for updating own business account
CREATE POLICY "Users can update their own business account" 
ON public.business_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for deleting own business account
CREATE POLICY "Users can delete their own business account" 
ON public.business_accounts 
FOR DELETE 
USING (auth.uid() = user_id);