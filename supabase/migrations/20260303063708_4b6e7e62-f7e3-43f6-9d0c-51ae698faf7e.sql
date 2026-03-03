
-- Step 1: Add permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create business fund links"
ON public.business_collective_funds
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 2: Backfill missing business_collective_funds rows
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
SELECT cf.id, p.business_id, cf.business_product_id, c.linked_user_id
FROM collective_funds cf
JOIN products p ON p.id = cf.business_product_id
LEFT JOIN contacts c ON c.id = cf.beneficiary_contact_id
WHERE cf.business_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM business_collective_funds bcf WHERE bcf.fund_id = cf.id);
