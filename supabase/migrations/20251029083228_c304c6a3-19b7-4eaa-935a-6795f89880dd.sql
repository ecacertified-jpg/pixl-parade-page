-- Fix security issue: Add search_path to trigger function
DROP TRIGGER IF EXISTS update_favorites_updated_at ON favorites;
DROP FUNCTION IF EXISTS update_favorites_updated_at();

CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_updated_at();