-- 1. Ajouter country_code aux tables principales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE products ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE collective_funds ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE community_scores ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';
ALTER TABLE gratitude_wall ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';

-- 2. Créer des index pour optimiser les requêtes par pays
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_posts_country ON posts(country_code);
CREATE INDEX IF NOT EXISTS idx_business_accounts_country ON business_accounts(country_code);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country_code);
CREATE INDEX IF NOT EXISTS idx_collective_funds_country ON collective_funds(country_code);
CREATE INDEX IF NOT EXISTS idx_community_scores_country ON community_scores(country_code);
CREATE INDEX IF NOT EXISTS idx_gratitude_wall_country ON gratitude_wall(country_code);

-- 3. Trigger pour définir le pays lors de la création du profil
CREATE OR REPLACE FUNCTION set_profile_country()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country_code IS NULL THEN
    NEW.country_code := 'CI';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_profile_country ON profiles;
CREATE TRIGGER trigger_set_profile_country
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_country();