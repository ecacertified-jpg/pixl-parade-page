-- Migrer les données de la table businesses vers business_accounts
INSERT INTO public.business_accounts (
  user_id,
  business_name,
  business_type,
  phone,
  address,
  description,
  logo_url,
  website_url,
  email,
  opening_hours,
  delivery_zones,
  payment_info,
  delivery_settings,
  is_active,
  created_at,
  updated_at
)
SELECT 
  b.user_id,
  b.business_name,
  b.business_type,
  b.phone,
  b.address,
  b.description,
  b.logo_url,
  b.website_url,
  b.email,
  b.opening_hours,
  b.delivery_zones,
  b.payment_info,
  b.delivery_settings,
  b.is_active,
  b.created_at,
  b.updated_at
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_accounts ba 
  WHERE ba.user_id = b.user_id
);

-- Mettre à jour les produits pour s'assurer qu'ils pointent vers les comptes business corrects
UPDATE public.products 
SET business_owner_id = ba.user_id
FROM public.business_accounts ba
WHERE products.business_owner_id = ba.user_id;