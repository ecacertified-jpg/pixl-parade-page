
-- Trigger function to auto-detect duplicate phone profiles at signup
CREATE OR REPLACE FUNCTION public.detect_duplicate_phone_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user_id uuid;
  existing_profile_id uuid;
  phone_suffix text;
BEGIN
  -- Only check if phone is provided
  IF NEW.phone IS NULL OR trim(NEW.phone) = '' THEN
    RETURN NEW;
  END IF;

  -- Normalize: extract last 8 digits for comparison
  phone_suffix := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  phone_suffix := right(phone_suffix, 8);

  -- Look for an existing active profile with the same phone suffix
  SELECT p.user_id, p.id INTO existing_user_id, existing_profile_id
  FROM profiles p
  WHERE p.user_id != NEW.user_id
    AND p.is_suspended IS NOT TRUE
    AND right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 8) = phone_suffix
  LIMIT 1;

  -- If a duplicate is found, log it to detected_duplicate_accounts
  IF existing_user_id IS NOT NULL THEN
    INSERT INTO detected_duplicate_accounts (
      phone_number,
      user_ids,
      profile_ids,
      status,
      detection_source
    ) VALUES (
      NEW.phone,
      ARRAY[existing_user_id, NEW.user_id],
      ARRAY[existing_profile_id, NEW.id],
      'pending',
      'signup_trigger'
    )
    ON CONFLICT DO NOTHING;

    RAISE LOG 'Duplicate phone detected at signup: phone=%, new_user=%, existing_user=%',
      NEW.phone, NEW.user_id, existing_user_id;
  END IF;

  -- Never block the insertion
  RETURN NEW;
END;
$$;

-- Create the trigger (drop first if exists to be safe)
DROP TRIGGER IF EXISTS trg_detect_duplicate_phone ON profiles;
CREATE TRIGGER trg_detect_duplicate_phone
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_duplicate_phone_on_insert();
