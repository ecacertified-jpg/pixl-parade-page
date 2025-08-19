-- Ajouter les politiques RLS pour permettre l'ajout, la modification et la suppression de produits
-- Créer une table pour gérer les comptes business
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  business_type TEXT,
  phone TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table business_accounts
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour business_accounts
CREATE POLICY "Users can manage their own business account" 
ON public.business_accounts 
FOR ALL 
USING (auth.uid() = user_id);

-- Ajouter une colonne business_owner_id à la table products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS business_owner_id UUID REFERENCES auth.users(id);

-- Mettre à jour les produits existants avec un propriétaire par défaut (utilisateur admin)
UPDATE public.products 
SET business_owner_id = 'aae8fedd-8b84-4434-bf18-a7b8e78ffab5'
WHERE business_owner_id IS NULL;

-- Politiques RLS pour products - permettre aux propriétaires de gérer leurs produits
CREATE POLICY "Business owners can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = business_owner_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_business_accounts_updated_at
BEFORE UPDATE ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();