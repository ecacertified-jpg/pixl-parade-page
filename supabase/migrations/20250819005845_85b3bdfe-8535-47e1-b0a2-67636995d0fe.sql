-- Ajouter les politiques RLS pour permettre l'ajout, la modification et la suppression de produits
-- Ajouter une colonne business_owner_id à la table products si elle n'existe pas
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS business_owner_id UUID REFERENCES auth.users(id);

-- Mettre à jour les produits existants avec un propriétaire par défaut
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