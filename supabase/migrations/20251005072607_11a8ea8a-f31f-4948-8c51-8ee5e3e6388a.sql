-- Fixer les warnings de sécurité pour les nouvelles fonctions
-- en ajoutant SET search_path = public

DROP FUNCTION IF EXISTS extract_beneficiary_name(TEXT);
DROP FUNCTION IF EXISTS find_contact_by_name(UUID, TEXT);

-- Fonction pour extraire le nom du bénéficiaire depuis le titre de la cagnotte
CREATE OR REPLACE FUNCTION extract_beneficiary_name(fund_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Extraire le nom après "pour " ou "Pour "
  IF fund_title ~* 'pour\s+(.+)' THEN
    RETURN TRIM(SUBSTRING(fund_title FROM 'pour\s+(.+)'));
  END IF;
  RETURN NULL;
END;
$$;

-- Fonction pour trouver un contact par nom (recherche floue)
CREATE OR REPLACE FUNCTION find_contact_by_name(p_creator_id UUID, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  contact_id UUID;
BEGIN
  -- Recherche exacte d'abord
  SELECT id INTO contact_id
  FROM public.contacts
  WHERE user_id = p_creator_id
  AND LOWER(name) = LOWER(p_name)
  LIMIT 1;
  
  IF contact_id IS NOT NULL THEN
    RETURN contact_id;
  END IF;
  
  -- Recherche partielle si pas de résultat exact
  SELECT id INTO contact_id
  FROM public.contacts
  WHERE user_id = p_creator_id
  AND LOWER(name) LIKE '%' || LOWER(p_name) || '%'
  LIMIT 1;
  
  RETURN contact_id;
END;
$$;