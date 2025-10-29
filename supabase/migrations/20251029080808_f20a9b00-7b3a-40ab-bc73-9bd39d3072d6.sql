-- Correction sécurité : Ajouter search_path aux fonctions créées

DROP FUNCTION IF EXISTS update_user_preferences_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();