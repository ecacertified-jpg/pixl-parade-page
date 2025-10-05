-- Relancer la migration pour les cagnottes non liées avec une recherche plus flexible
DO $$
DECLARE
  fund_record RECORD;
  beneficiary_name TEXT;
  contact_id UUID;
  updated_count INTEGER := 0;
  search_pattern TEXT;
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
      -- Essayer plusieurs stratégies de recherche
      
      -- Stratégie 1: Recherche exacte
      SELECT id INTO contact_id
      FROM public.contacts
      WHERE user_id = fund_record.creator_id
      AND LOWER(name) = LOWER(beneficiary_name)
      LIMIT 1;
      
      -- Stratégie 2: Si pas de résultat, chercher le prénom uniquement (premier mot)
      IF contact_id IS NULL THEN
        search_pattern := SPLIT_PART(beneficiary_name, ' ', 1);
        SELECT id INTO contact_id
        FROM public.contacts
        WHERE user_id = fund_record.creator_id
        AND LOWER(name) LIKE LOWER(search_pattern) || '%'
        LIMIT 1;
      END IF;
      
      -- Stratégie 3: Si toujours pas de résultat, chercher n'importe quel mot du nom
      IF contact_id IS NULL THEN
        SELECT id INTO contact_id
        FROM public.contacts
        WHERE user_id = fund_record.creator_id
        AND (
          LOWER(name) LIKE '%' || LOWER(SPLIT_PART(beneficiary_name, ' ', 1)) || '%'
          OR LOWER(name) LIKE '%' || LOWER(SPLIT_PART(beneficiary_name, ' ', 2)) || '%'
        )
        LIMIT 1;
      END IF;
      
      IF contact_id IS NOT NULL THEN
        -- Mettre à jour la cagnotte
        UPDATE public.collective_funds
        SET beneficiary_contact_id = contact_id
        WHERE id = fund_record.id;
        
        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complémentaire terminée: % cagnottes supplémentaires mises à jour', updated_count;
END $$;