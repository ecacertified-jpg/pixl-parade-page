-- Créer la table pour les catégories personnalisées des prestataires
CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Package',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_owner_id, name)
);

-- Index pour améliorer les performances
CREATE INDEX idx_business_categories_owner ON public.business_categories(business_owner_id);
CREATE INDEX idx_business_categories_active ON public.business_categories(is_active) WHERE is_active = true;

-- RLS policies pour business_categories
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their own categories"
  ON public.business_categories FOR SELECT
  USING (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can create their own categories"
  ON public.business_categories FOR INSERT
  WITH CHECK (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can update their own categories"
  ON public.business_categories FOR UPDATE
  USING (auth.uid() = business_owner_id)
  WITH CHECK (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can delete their own categories"
  ON public.business_categories FOR DELETE
  USING (auth.uid() = business_owner_id);

-- Ajouter une colonne pour les catégories personnalisées dans products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS business_category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL;

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_products_business_category ON public.products(business_category_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_business_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_business_categories_updated_at ON public.business_categories;
CREATE TRIGGER trigger_update_business_categories_updated_at
  BEFORE UPDATE ON public.business_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_categories_updated_at();

-- Fonction pour obtenir le nom de catégorie (personnalisée ou prédéfinie)
CREATE OR REPLACE FUNCTION public.get_product_category_name(p_product_id UUID)
RETURNS TEXT AS $$
DECLARE
  category_name TEXT;
  business_cat_id UUID;
  standard_cat_id UUID;
BEGIN
  -- Récupérer les IDs de catégories du produit
  SELECT business_category_id, category_id 
  INTO business_cat_id, standard_cat_id
  FROM public.products 
  WHERE id = p_product_id;
  
  -- Priorité aux catégories personnalisées
  IF business_cat_id IS NOT NULL THEN
    SELECT name INTO category_name 
    FROM public.business_categories 
    WHERE id = business_cat_id;
    RETURN category_name;
  END IF;
  
  -- Sinon, utiliser la catégorie prédéfinie
  IF standard_cat_id IS NOT NULL THEN
    SELECT name INTO category_name 
    FROM public.categories 
    WHERE id = standard_cat_id;
    RETURN category_name;
  END IF;
  
  RETURN 'Sans catégorie';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;