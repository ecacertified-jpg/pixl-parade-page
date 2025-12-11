-- Add SELECT policy for customers to view their own orders
CREATE POLICY "Customers can view their orders" 
ON business_orders 
FOR SELECT 
USING (auth.uid() = customer_id);