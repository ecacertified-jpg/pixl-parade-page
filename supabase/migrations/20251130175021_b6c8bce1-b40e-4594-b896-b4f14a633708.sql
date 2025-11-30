-- Allow public read access to active business accounts basic information
-- This enables displaying business names on product cards in the shop
CREATE POLICY "Anyone can view active business accounts basic info" 
ON business_accounts 
FOR SELECT 
USING (is_active = true);