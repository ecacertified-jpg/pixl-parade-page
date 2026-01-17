-- Table pour suivre les prestataires
CREATE TABLE public.business_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contrainte d'unicité : un utilisateur ne peut suivre une boutique qu'une fois
  UNIQUE(follower_id, business_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_business_follows_follower ON public.business_follows(follower_id);
CREATE INDEX idx_business_follows_business ON public.business_follows(business_id);

-- Enable RLS
ALTER TABLE public.business_follows ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "Users can view their own follows"
  ON public.business_follows FOR SELECT
  USING (auth.uid() = follower_id);

-- Policy : Les utilisateurs peuvent suivre des boutiques
CREATE POLICY "Users can follow businesses"
  ON public.business_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Policy : Les utilisateurs peuvent se désabonner
CREATE POLICY "Users can unfollow businesses"
  ON public.business_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Policy : Les prestataires peuvent voir leurs abonnés
CREATE POLICY "Business owners can view their followers"
  ON public.business_follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND user_id = auth.uid()
    )
  );

-- Policy : Tout le monde peut voir le nombre d'abonnés (pour le compteur public)
CREATE POLICY "Anyone can count followers"
  ON public.business_follows FOR SELECT
  USING (true);