-- Ajouter les colonnes latitude et longitude à business_accounts
ALTER TABLE public.business_accounts 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Index pour les requêtes géographiques futures
CREATE INDEX IF NOT EXISTS idx_business_accounts_coordinates 
ON public.business_accounts (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.business_accounts.latitude IS 'GPS latitude de l emplacement du prestataire';
COMMENT ON COLUMN public.business_accounts.longitude IS 'GPS longitude de l emplacement du prestataire';