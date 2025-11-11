-- Table des définitions de badges (catalogue)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'birthday', 'contribution', 'community', 'achievement'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  level INTEGER NOT NULL DEFAULT 1, -- 1-5 for progression badges
  requirement_type TEXT NOT NULL, -- 'count', 'amount', 'milestone'
  requirement_threshold INTEGER, -- For count/amount badges
  color_primary TEXT NOT NULL, -- Hex color for badge gradient
  color_secondary TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_key ON public.badge_definitions(badge_key);

-- Table des badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL REFERENCES public.badge_definitions(badge_key) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  progress_value INTEGER DEFAULT 0, -- Progression vers le prochain niveau
  metadata JSONB DEFAULT '{}'::jsonb,
  is_showcased BOOLEAN DEFAULT FALSE, -- Badge affiché sur le profil
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Un utilisateur ne peut gagner un badge qu'une seule fois
  UNIQUE(user_id, badge_key)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_key);
CREATE INDEX IF NOT EXISTS idx_user_badges_showcased ON public.user_badges(is_showcased) WHERE is_showcased = TRUE;

-- Enable RLS
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies pour badge_definitions
CREATE POLICY "Badge definitions are viewable by everyone"
  ON public.badge_definitions
  FOR SELECT
  USING (is_active = TRUE);

-- Policies pour user_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' showcased badges"
  ON public.user_badges
  FOR SELECT
  USING (is_showcased = TRUE);

CREATE POLICY "Users can update their own badges"
  ON public.user_badges
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert user badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (true);

-- Insérer les définitions de badges de contribution
INSERT INTO public.badge_definitions (badge_key, category, name, description, icon, level, requirement_type, requirement_threshold, color_primary, color_secondary) VALUES
-- Badges de dons (contribution)
('generous_donor_1', 'contribution', 'Donateur Généreux', 'A contribué à 5 cagnottes', '💝', 1, 'count', 5, '#FF6B6B', '#FF8E8E'),
('generous_donor_2', 'contribution', 'Donateur Exceptionnel', 'A contribué à 10 cagnottes', '💖', 2, 'count', 10, '#FF4757', '#FF6B6B'),
('generous_donor_3', 'contribution', 'Philanthrope', 'A contribué à 25 cagnottes', '💎', 3, 'count', 25, '#9B59B6', '#BB6BD9'),
('generous_donor_4', 'contribution', 'Mécène', 'A contribué à 50 cagnottes', '👑', 4, 'count', 50, '#F39C12', '#F5B041'),
('generous_donor_5', 'contribution', 'Légende de la Générosité', 'A contribué à 100 cagnottes', '🌟', 5, 'count', 100, '#FFD700', '#FFA500'),

-- Badges de montants donnés
('big_spender_1', 'contribution', 'Généreux', 'A donné 50 000 FCFA au total', '💰', 1, 'amount', 50000, '#3498DB', '#5DADE2'),
('big_spender_2', 'contribution', 'Très Généreux', 'A donné 100 000 FCFA au total', '💵', 2, 'amount', 100000, '#2980B9', '#3498DB'),
('big_spender_3', 'contribution', 'Grand Donateur', 'A donné 250 000 FCFA au total', '💸', 3, 'amount', 250000, '#1ABC9C', '#48C9B0'),
('big_spender_4', 'contribution', 'Bienfaiteur', 'A donné 500 000 FCFA au total', '🏆', 4, 'amount', 500000, '#E67E22', '#EB984E'),
('big_spender_5', 'contribution', 'Philanthrope Majeur', 'A donné 1 000 000 FCFA au total', '👑', 5, 'amount', 1000000, '#C0392B', '#E74C3C'),

-- Badges de création de cagnottes
('fund_creator_1', 'contribution', 'Créateur', 'A créé 3 cagnottes', '🎯', 1, 'count', 3, '#16A085', '#1ABC9C'),
('fund_creator_2', 'contribution', 'Organisateur', 'A créé 10 cagnottes', '🎪', 2, 'count', 10, '#27AE60', '#2ECC71'),
('fund_creator_3', 'contribution', 'Maître Organisateur', 'A créé 25 cagnottes', '🎭', 3, 'count', 25, '#8E44AD', '#9B59B6'),
('fund_creator_4', 'contribution', 'Expert en Collectes', 'A créé 50 cagnottes', '🌟', 4, 'count', 50, '#F39C12', '#F5B041'),
('fund_creator_5', 'contribution', 'Légende des Cagnottes', 'A créé 100 cagnottes', '👑', 5, 'count', 100, '#E74C3C', '#EC7063'),

-- Badges de cagnottes réussies (atteint l'objectif)
('successful_funds_1', 'achievement', 'Objectif Atteint', '3 cagnottes ont atteint leur objectif', '🎯', 1, 'count', 3, '#2ECC71', '#58D68D'),
('successful_funds_2', 'achievement', 'Succès Multiple', '10 cagnottes ont atteint leur objectif', '🏅', 2, 'count', 10, '#27AE60', '#52BE80'),
('successful_funds_3', 'achievement', 'Expert du Succès', '25 cagnottes ont atteint leur objectif', '🏆', 3, 'count', 25, '#229954', '#28B463'),
('successful_funds_4', 'achievement', 'Champion des Collectes', '50 cagnottes ont atteint leur objectif', '👑', 4, 'count', 50, '#1E8449', '#239B56'),
('successful_funds_5', 'achievement', 'Maître des Objectifs', '100 cagnottes ont atteint leur objectif', '💎', 5, 'count', 100, '#186A3B', '#1D8348'),

-- Badges communautaires
('social_butterfly', 'community', 'Papillon Social', 'A ajouté 10 amis', '🦋', 1, 'count', 10, '#FF69B4', '#FFB6C1'),
('network_builder', 'community', 'Bâtisseur de Réseau', 'A ajouté 25 amis', '🌐', 2, 'count', 25, '#FF1493', '#FF69B4'),
('community_leader', 'community', 'Leader Communautaire', 'A ajouté 50 amis', '👥', 3, 'count', 50, '#C71585', '#DB7093'),
('super_connector', 'community', 'Super Connecteur', 'A ajouté 100 amis', '🌟', 4, 'count', 100, '#8B008B', '#9932CC'),
('legend_connector', 'community', 'Légende du Réseau', 'A ajouté 250 amis', '👑', 5, 'count', 250, '#4B0082', '#6A0DAD'),

-- Badges spéciaux
('early_adopter', 'achievement', 'Pionnier', 'Parmi les premiers utilisateurs de JOIE DE VIVRE', '🚀', 1, 'milestone', NULL, '#3498DB', '#5DADE2'),
('gratitude_master', 'achievement', 'Maître de la Gratitude', 'A envoyé 25 messages de remerciement', '🙏', 1, 'count', 25, '#E91E63', '#F06292'),
('party_planner', 'achievement', 'Organisateur de Fêtes', 'A organisé 10 événements surprise', '🎉', 1, 'count', 10, '#9C27B0', '#BA68C8');

-- Vue pour obtenir les badges d'un utilisateur avec leurs définitions
CREATE OR REPLACE VIEW public.user_badges_with_definitions AS
SELECT 
  ub.id,
  ub.user_id,
  ub.badge_key,
  ub.earned_at,
  ub.progress_value,
  ub.metadata,
  ub.is_showcased,
  bd.category,
  bd.name,
  bd.description,
  bd.icon,
  bd.level,
  bd.requirement_type,
  bd.requirement_threshold,
  bd.color_primary,
  bd.color_secondary
FROM public.user_badges ub
JOIN public.badge_definitions bd ON ub.badge_key = bd.badge_key
WHERE bd.is_active = TRUE;

-- Grant access
GRANT SELECT ON public.user_badges_with_definitions TO authenticated;
GRANT SELECT ON public.badge_definitions TO authenticated;

-- Commentaires
COMMENT ON TABLE public.badge_definitions IS 'Catalogue de tous les badges disponibles sur la plateforme';
COMMENT ON TABLE public.user_badges IS 'Badges obtenus par les utilisateurs';
COMMENT ON COLUMN public.user_badges.is_showcased IS 'Badge affiché sur le profil public de l''utilisateur';