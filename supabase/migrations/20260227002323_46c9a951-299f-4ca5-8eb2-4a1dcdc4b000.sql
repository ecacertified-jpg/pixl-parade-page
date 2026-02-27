
CREATE OR REPLACE FUNCTION public.auto_link_contact_on_update()
  RETURNS trigger AS $$
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
    VALUES (NEW.user_id, found_user_id, true, true)
    ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;
  ELSE
    NEW.linked_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_link_contact_on_update
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_contact_on_update();
