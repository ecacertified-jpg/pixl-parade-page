
-- Step 1: Make beneficiary_user_id nullable
ALTER TABLE public.business_collective_funds
  ALTER COLUMN beneficiary_user_id DROP NOT NULL;

-- Step 2: Drop the existing FK constraint and recreate it to allow NULL
-- (The FK itself already allows NULL once the column is nullable, no need to recreate)

-- Step 3: Backfill missing business_collective_funds rows
INSERT INTO public.business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
SELECT
  cf.id,
  p.business_id,
  cf.business_product_id,
  c.linked_user_id
FROM public.collective_funds cf
JOIN public.products p ON p.id = cf.business_product_id
LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
WHERE cf.business_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.business_collective_funds bcf WHERE bcf.fund_id = cf.id
  );
