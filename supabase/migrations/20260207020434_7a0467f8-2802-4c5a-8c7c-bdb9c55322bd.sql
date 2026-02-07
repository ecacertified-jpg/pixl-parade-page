
-- Étape 1: Corriger tous les business existants en synchronisant avec le profil du propriétaire
UPDATE business_accounts ba
SET country_code = p.country_code
FROM profiles p
WHERE ba.user_id = p.user_id
AND p.country_code IS NOT NULL
AND ba.country_code IS DISTINCT FROM p.country_code;

-- Étape 2: Créer le trigger de sécurité pour les futurs INSERT
CREATE OR REPLACE FUNCTION public.sync_business_country_from_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    SELECT country_code INTO NEW.country_code
    FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_business_country
BEFORE INSERT ON public.business_accounts
FOR EACH ROW EXECUTE FUNCTION public.sync_business_country_from_profile();
