
-- ============================================================
-- Correction de l'intégrité des relations symétriques
-- Étapes : nettoyage doublons, normalisation, index, triggers
-- ============================================================

-- ÉTAPE 1 : Fusionner et supprimer les doublons (A,B) / (B,A)
-- On garde la ligne avec le plus petit created_at, on fusionne can_see_funds/can_see_events
WITH duplicates AS (
  SELECT
    r1.id AS keep_id,
    r2.id AS delete_id,
    r1.can_see_funds AS keep_funds,
    r2.can_see_funds AS dup_funds,
    r1.can_see_events AS keep_events,
    r2.can_see_events AS dup_events
  FROM contact_relationships r1
  JOIN contact_relationships r2
    ON r1.user_a = r2.user_b
    AND r1.user_b = r2.user_a
    AND r1.created_at <= r2.created_at
    AND r1.id <> r2.id
)
UPDATE contact_relationships cr
SET
  can_see_funds = COALESCE(d.keep_funds, false) OR COALESCE(d.dup_funds, false),
  can_see_events = COALESCE(d.keep_events, false) OR COALESCE(d.dup_events, false)
FROM duplicates d
WHERE cr.id = d.keep_id;

-- Supprimer les lignes dupliquées
DELETE FROM contact_relationships
WHERE id IN (
  SELECT r2.id
  FROM contact_relationships r1
  JOIN contact_relationships r2
    ON r1.user_a = r2.user_b
    AND r1.user_b = r2.user_a
    AND r1.created_at <= r2.created_at
    AND r1.id <> r2.id
);

-- ÉTAPE 2 : Normaliser toutes les lignes (LEAST/GREATEST)
UPDATE contact_relationships
SET
  user_a = LEAST(user_a, user_b),
  user_b = GREATEST(user_a, user_b)
WHERE user_a > user_b;

-- ÉTAPE 3 : Supprimer l'ancienne contrainte et ajouter l'index symétrique
ALTER TABLE contact_relationships DROP CONSTRAINT IF EXISTS unique_relationship;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_relationships_symmetric
ON contact_relationships (LEAST(user_a, user_b), GREATEST(user_a, user_b));

-- ÉTAPE 4 : Recréer auto_link_contact_on_insert avec LEAST/GREATEST
CREATE OR REPLACE FUNCTION public.auto_link_contact_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_phone TEXT;
  phone_suffix TEXT;
  found_user_id UUID;
BEGIN
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    RETURN NEW;
  END IF;

  clean_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  phone_suffix := RIGHT(clean_phone, 8);

  IF LENGTH(phone_suffix) < 8 THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE phone IS NOT NULL
    AND RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = phone_suffix
    AND user_id <> NEW.user_id
  LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    NEW.linked_user_id := found_user_id;

    INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
    VALUES (LEAST(NEW.user_id, found_user_id), GREATEST(NEW.user_id, found_user_id), true, true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ÉTAPE 4b : Recréer auto_link_contact_on_update avec LEAST/GREATEST
CREATE OR REPLACE FUNCTION public.auto_link_contact_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_phone TEXT;
  phone_suffix TEXT;
  found_user_id UUID;
BEGIN
  IF OLD.phone IS NOT DISTINCT FROM NEW.phone THEN
    RETURN NEW;
  END IF;

  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    NEW.linked_user_id := NULL;
    RETURN NEW;
  END IF;

  clean_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  phone_suffix := RIGHT(clean_phone, 8);

  IF LENGTH(phone_suffix) < 8 THEN
    NEW.linked_user_id := NULL;
    RETURN NEW;
  END IF;

  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE phone IS NOT NULL
    AND RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = phone_suffix
    AND user_id <> NEW.user_id
  LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    NEW.linked_user_id := found_user_id;
    INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
    VALUES (LEAST(NEW.user_id, found_user_id), GREATEST(NEW.user_id, found_user_id), true, true)
    ON CONFLICT DO NOTHING;
  ELSE
    NEW.linked_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ÉTAPE 5 : Recréer handle_new_user avec LEAST/GREATEST
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
  user_city TEXT;
  clean_phone TEXT;
  phone_suffix TEXT;
  matching_contact RECORD;
BEGIN
  phone_number := COALESCE(
    NEW.raw_user_meta_data ->> 'phone',
    NEW.phone
  );
  
  -- Step 1: Detect country from phone prefix
  detected_country := CASE
    WHEN phone_number LIKE '+229%' THEN 'BJ'
    WHEN phone_number LIKE '+221%' THEN 'SN'
    WHEN phone_number LIKE '+228%' THEN 'TG'
    WHEN phone_number LIKE '+223%' THEN 'ML'
    WHEN phone_number LIKE '+226%' THEN 'BF'
    WHEN phone_number LIKE '+225%' THEN 'CI'
    ELSE 'CI'
  END;
  
  -- Step 2: If defaulted to CI and no phone, try to infer from city
  IF detected_country = 'CI' AND (phone_number IS NULL OR phone_number = '') THEN
    user_city := LOWER(COALESCE(NEW.raw_user_meta_data ->> 'city', ''));
    
    IF user_city LIKE '%cotonou%' OR user_city LIKE '%porto-novo%' OR user_city LIKE '%parakou%' 
       OR user_city LIKE '%bohicon%' OR user_city LIKE '%abomey%' OR user_city LIKE '%natitingou%'
       OR user_city LIKE '%djougou%' OR user_city LIKE '%lokossa%' OR user_city LIKE '%ouidah%'
       OR user_city LIKE '%akpakpa%' OR user_city LIKE '%calavi%' OR user_city LIKE '%godomey%'
       OR user_city LIKE '%cadjehoun%' OR user_city LIKE '%fidjrosse%' THEN
      detected_country := 'BJ';
    ELSIF user_city LIKE '%dakar%' OR user_city LIKE '%thies%' OR user_city LIKE '%kaolack%'
       OR user_city LIKE '%saint-louis%' OR user_city LIKE '%ziguinchor%' OR user_city LIKE '%touba%'
       OR user_city LIKE '%rufisque%' OR user_city LIKE '%mbour%' OR user_city LIKE '%tambacounda%' THEN
      detected_country := 'SN';
    ELSIF user_city LIKE '%lome%' OR user_city LIKE '%lomé%' OR user_city LIKE '%kara%' 
       OR user_city LIKE '%sokode%' OR user_city LIKE '%sokodé%' OR user_city LIKE '%atakpame%'
       OR user_city LIKE '%kpalime%' OR user_city LIKE '%kpalimé%' THEN
      detected_country := 'TG';
    ELSIF user_city LIKE '%bamako%' OR user_city LIKE '%sikasso%' OR user_city LIKE '%mopti%'
       OR user_city LIKE '%segou%' OR user_city LIKE '%ségou%' OR user_city LIKE '%koutiala%'
       OR user_city LIKE '%kayes%' THEN
      detected_country := 'ML';
    ELSIF user_city LIKE '%ouagadougou%' OR user_city LIKE '%bobo-dioulasso%' OR user_city LIKE '%koudougou%'
       OR user_city LIKE '%ouahigouya%' OR user_city LIKE '%banfora%' THEN
      detected_country := 'BF';
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, first_name, last_name, birthday, city, phone, country_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthday')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'city',
    phone_number,
    detected_country
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_reciprocity_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Step 3: Auto-link contacts by phone number
  BEGIN
    IF phone_number IS NOT NULL AND phone_number <> '' THEN
      clean_phone := regexp_replace(phone_number, '[^0-9]', '', 'g');
      phone_suffix := RIGHT(clean_phone, 8);

      IF LENGTH(phone_suffix) = 8 THEN
        FOR matching_contact IN
          SELECT id, user_id
          FROM public.contacts
          WHERE phone IS NOT NULL
            AND RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = phone_suffix
            AND (linked_user_id IS NULL OR linked_user_id <> NEW.id)
        LOOP
          UPDATE public.contacts
          SET linked_user_id = NEW.id
          WHERE id = matching_contact.id;

          -- Create relationship with LEAST/GREATEST normalization
          INSERT INTO public.contact_relationships (user_a, user_b, can_see_events, can_see_funds)
          VALUES (LEAST(matching_contact.user_id, NEW.id), GREATEST(matching_contact.user_id, NEW.id), true, true)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: contact linking failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
