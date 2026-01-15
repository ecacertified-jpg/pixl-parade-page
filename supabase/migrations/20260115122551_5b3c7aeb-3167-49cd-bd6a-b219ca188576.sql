-- Fix search_path for the newly created function
CREATE OR REPLACE FUNCTION update_country_struggling_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;