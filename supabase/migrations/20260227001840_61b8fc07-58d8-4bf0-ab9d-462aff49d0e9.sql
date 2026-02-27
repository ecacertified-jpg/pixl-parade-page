
-- ============================================================
-- ÉTAPE 1 : Backfill rétroactif des linked_user_id manquants
-- ============================================================

-- 1a. Lier les contacts existants aux profils par les 8 derniers chiffres
UPDATE contacts c
SET linked_user_id = p.user_id
FROM profiles p
WHERE c.linked_user_id IS NULL
  AND c.phone IS NOT NULL
  AND p.phone IS NOT NULL
  AND RIGHT(regexp_replace(c.phone, '[^0-9]', '', 'g'), 8)
    = RIGHT(regexp_replace(p.phone, '[^0-9]', '', 'g'), 8)
  AND c.user_id <> p.user_id;

-- 1b. Créer les contact_relationships manquantes
INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
SELECT c.user_id, c.linked_user_id, true, true
FROM contacts c
WHERE c.linked_user_id IS NOT NULL
ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;

-- ============================================================
-- ÉTAPE 2 : Trigger auto-link sur INSERT dans contacts
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_link_contact_on_insert()
  RETURNS trigger AS $$
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
    VALUES (NEW.user_id, found_user_id, true, true)
    ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_link_contact
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_contact_on_insert();
