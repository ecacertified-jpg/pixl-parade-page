-- Restore authenticated read access to active businesses for catalog/shop pages
CREATE POLICY "Authenticated users can view active businesses"
ON business_accounts FOR SELECT TO authenticated
USING (
  is_active = true 
  AND status = 'active'
);