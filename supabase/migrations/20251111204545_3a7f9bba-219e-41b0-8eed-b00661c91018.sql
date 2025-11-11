-- Table pour suivre l'historique des célébrations d'anniversaire
CREATE TABLE IF NOT EXISTS public.birthday_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  celebration_year INTEGER NOT NULL,
  celebrated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  age_at_celebration INTEGER,
  milestone_age BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Éviter les doublons pour une même année
  UNIQUE(user_id, celebration_year)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_birthday_celebrations_user ON public.birthday_celebrations(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_celebrations_year ON public.birthday_celebrations(celebration_year);

-- Enable RLS
ALTER TABLE public.birthday_celebrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own celebration history
CREATE POLICY "Users can view their own birthday celebrations"
  ON public.birthday_celebrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert celebrations (for edge functions)
CREATE POLICY "System can insert birthday celebrations"
  ON public.birthday_celebrations
  FOR INSERT
  WITH CHECK (true);

-- Ajouter des colonnes pour les badges dans la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday_badge_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_birthdays_celebrated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_birthday_on_platform DATE,
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Fonction pour calculer le niveau de badge selon le nombre d'anniversaires
CREATE OR REPLACE FUNCTION public.calculate_birthday_badge_level(celebrations_count INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE 
    WHEN celebrations_count >= 10 THEN RETURN 'diamond';
    WHEN celebrations_count >= 5 THEN RETURN 'platinum';
    WHEN celebrations_count >= 3 THEN RETURN 'gold';
    WHEN celebrations_count >= 2 THEN RETURN 'silver';
    WHEN celebrations_count >= 1 THEN RETURN 'bronze';
    ELSE RETURN 'none';
  END CASE;
END;
$$;

-- Fonction pour obtenir le nom du badge en français
CREATE OR REPLACE FUNCTION public.get_badge_name(badge_level TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE badge_level
    WHEN 'diamond' THEN RETURN '💎 Diamant';
    WHEN 'platinum' THEN RETURN '⭐ Platine';
    WHEN 'gold' THEN RETURN '🏆 Or';
    WHEN 'silver' THEN RETURN '🥈 Argent';
    WHEN 'bronze' THEN RETURN '🥉 Bronze';
    ELSE RETURN '🎂 Nouveau';
  END CASE;
END;
$$;

-- Vue pour obtenir les statistiques de badges par utilisateur
CREATE OR REPLACE VIEW public.user_birthday_stats AS
SELECT 
  p.id as user_id,
  p.user_id as auth_user_id,
  COALESCE(p.first_name || ' ' || p.last_name, p.first_name, 'Utilisateur') as user_name,
  p.birthday_badge_level,
  p.total_birthdays_celebrated,
  p.first_birthday_on_platform,
  calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0)) as badge_level,
  get_badge_name(calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0))) as badge_name,
  COUNT(bc.id) as celebrations_count,
  ARRAY_AGG(bc.celebration_year ORDER BY bc.celebration_year DESC) FILTER (WHERE bc.celebration_year IS NOT NULL) as years_celebrated
FROM public.profiles p
LEFT JOIN public.birthday_celebrations bc ON bc.user_id = p.user_id
GROUP BY p.id, p.user_id, p.first_name, p.last_name, p.birthday_badge_level, p.total_birthdays_celebrated, p.first_birthday_on_platform;

-- Grant access to the view
GRANT SELECT ON public.user_birthday_stats TO authenticated;

-- Commentaires pour documentation
COMMENT ON TABLE public.birthday_celebrations IS 'Historique des anniversaires célébrés sur la plateforme par chaque utilisateur';
COMMENT ON COLUMN public.profiles.birthday_badge_level IS 'Niveau du badge de fidélité anniversaire (0-5)';
COMMENT ON COLUMN public.profiles.total_birthdays_celebrated IS 'Nombre total d''anniversaires célébrés sur la plateforme';
COMMENT ON COLUMN public.profiles.first_birthday_on_platform IS 'Date du premier anniversaire célébré sur la plateforme';