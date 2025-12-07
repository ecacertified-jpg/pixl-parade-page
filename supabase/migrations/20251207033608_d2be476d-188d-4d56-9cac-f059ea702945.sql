-- Corriger la cotisation existante pour "Boucles d'oreilles pour Richmond"
UPDATE public.collective_funds
SET 
  business_product_id = 'def2f7ce-ce43-45b7-82db-0558bcdd8199',
  created_by_business_id = 'dfd62668-a1ad-4f25-9c8a-952c75da1612'
WHERE id = '5157ede7-1762-401c-8a0c-69dd17535378'
AND business_product_id IS NULL;