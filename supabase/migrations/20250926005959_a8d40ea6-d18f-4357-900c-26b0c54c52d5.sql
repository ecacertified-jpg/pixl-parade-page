-- Fix the UPDATE policy for products table to include WITH CHECK clause
DROP POLICY "Business owners can update their own products" ON products;

CREATE POLICY "Business owners can update their own products" 
ON products 
FOR UPDATE 
USING (auth.uid() = business_owner_id)
WITH CHECK (auth.uid() = business_owner_id);