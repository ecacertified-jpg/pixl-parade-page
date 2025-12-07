-- Corriger la cotisation existante pour Richmond en ajoutant le lien vers le produit business
UPDATE public.collective_funds 
SET 
  business_product_id = 'def2f7ce-ce43-45b7-82db-0558bcdd8199',
  created_by_business_id = (
    SELECT ba.id 
    FROM public.business_accounts ba 
    JOIN public.products p ON p.business_owner_id = ba.user_id 
    WHERE p.id = 'def2f7ce-ce43-45b7-82db-0558bcdd8199'
    LIMIT 1
  )
WHERE id = '10e0f55c-612e-4d17-8e8f-ea7ff4061604';