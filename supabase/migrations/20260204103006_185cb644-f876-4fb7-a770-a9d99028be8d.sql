-- Part 1: Fix existing profiles with incorrect country codes based on phone prefix
UPDATE profiles
SET country_code = CASE
  WHEN phone LIKE '+229%' THEN 'BJ'  -- Benin
  WHEN phone LIKE '+221%' THEN 'SN'  -- Senegal
  WHEN phone LIKE '+225%' THEN 'CI'  -- Cote d'Ivoire
  ELSE country_code
END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    (phone LIKE '+229%' AND (country_code IS NULL OR country_code != 'BJ')) OR
    (phone LIKE '+221%' AND (country_code IS NULL OR country_code != 'SN')) OR
    (phone LIKE '+225%' AND (country_code IS NULL OR country_code != 'CI'))
  );

-- Part 2: Update handle_new_user() to auto-detect country from phone prefix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
BEGIN
  -- Get phone from metadata or auth.users
  phone_number := COALESCE(
    NEW.raw_user_meta_data ->> 'phone',
    NEW.phone
  );
  
  -- Detect country from phone prefix
  detected_country := CASE
    WHEN phone_number LIKE '+229%' THEN 'BJ'  -- Benin
    WHEN phone_number LIKE '+221%' THEN 'SN'  -- Senegal
    WHEN phone_number LIKE '+225%' THEN 'CI'  -- Cote d'Ivoire
    ELSE 'CI'  -- Default to Cote d'Ivoire
  END;
  
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
  );

  -- Create default reciprocity preferences
  INSERT INTO public.user_reciprocity_preferences (
    user_id, alert_threshold, reminder_frequency,
    enable_suggestions, enable_notifications, private_mode
  )
  VALUES (NEW.id, 2.0, 'monthly', true, true, false);

  RETURN NEW;
END;
$function$;