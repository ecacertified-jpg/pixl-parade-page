-- Phase 1: MVP - Enrichissement user_favorites et création user_preferences

-- 1. Enrichir la table user_favorites avec les nouvelles colonnes
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS occasion_type TEXT,
ADD COLUMN IF NOT EXISTS accept_alternatives BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS context_usage TEXT[];

-- Ajouter un index pour les requêtes rapides par priorité
CREATE INDEX IF NOT EXISTS idx_user_favorites_priority ON user_favorites(user_id, priority_level);

-- 2. Créer la table user_preferences pour les préférences générales
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  
  -- Tailles & Mesures
  clothing_size TEXT,
  shoe_size TEXT,
  ring_size TEXT,
  
  -- Allergies & Restrictions (critique pour cadeaux)
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  
  -- Couleurs favorites (top 5 max)
  favorite_colors TEXT[] DEFAULT '{}',
  
  -- Gammes de prix préférées (par occasion)
  price_ranges JSONB DEFAULT '{
    "birthday": {"min": 10000, "max": 50000},
    "wedding": {"min": 25000, "max": 100000},
    "promotion": {"min": 15000, "max": 75000},
    "general": {"min": 5000, "max": 30000}
  }'::jsonb,
  
  -- Paramètres de visibilité
  visibility_settings JSONB DEFAULT '{
    "show_favorites_to_friends": true,
    "show_sizes": true,
    "show_price_ranges": true,
    "allow_suggestions": true
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les amis peuvent voir certaines préférences (selon visibilité)
CREATE POLICY "Friends can view preferences if allowed"
  ON user_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_relationships cr
      WHERE (cr.user_a = auth.uid() AND cr.user_b = user_id)
         OR (cr.user_b = auth.uid() AND cr.user_a = user_id)
    )
    AND (visibility_settings->>'show_favorites_to_friends')::boolean = true
  );

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();