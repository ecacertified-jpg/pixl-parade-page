-- Migration pour corriger les beneficiary_contact_id manquants dans collective_funds
-- et améliorer la fonction de récupération des anniversaires

-- Fonction pour extraire le nom du bénéficiaire depuis le titre de la cagnotte
CREATE OR REPLACE FUNCTION extract_beneficiary_name(fund_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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

-- Script de correction des cagnottes existantes sans beneficiary_contact_id
DO $$
DECLARE
  fund_record RECORD;
  beneficiary_name TEXT;
  contact_id UUID;
  updated_count INTEGER := 0;
BEGIN
  -- Parcourir toutes les cagnottes sans beneficiary_contact_id
  FOR fund_record IN 
    SELECT id, creator_id, title 
    FROM public.collective_funds 
    WHERE beneficiary_contact_id IS NULL
  LOOP
    -- Extraire le nom du bénéficiaire
    beneficiary_name := extract_beneficiary_name(fund_record.title);
    
    IF beneficiary_name IS NOT NULL THEN
      -- Chercher le contact correspondant
      contact_id := find_contact_by_name(fund_record.creator_id, beneficiary_name);
      
      IF contact_id IS NOT NULL THEN
        -- Mettre à jour la cagnotte
        UPDATE public.collective_funds
        SET beneficiary_contact_id = contact_id
        WHERE id = fund_record.id;
        
        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration terminée: % cagnottes mises à jour', updated_count;
END $$;