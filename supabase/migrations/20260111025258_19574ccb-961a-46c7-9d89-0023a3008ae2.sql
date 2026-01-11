-- 1. Mettre à jour la fonction handle_new_user pour inclure le téléphone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile with all available fields from user metadata including phone
  INSERT INTO public.profiles (user_id, first_name, last_name, birthday, city, phone)
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
    -- Prendre le phone depuis les metadata OU depuis auth.users.phone (OTP)
    COALESCE(
      NEW.raw_user_meta_data ->> 'phone',
      NEW.phone
    )
  );

  -- Créer les préférences de réciprocité par défaut
  INSERT INTO public.user_reciprocity_preferences (
    user_id,
    alert_threshold,
    reminder_frequency,
    enable_suggestions,
    enable_notifications,
    private_mode
  )
  VALUES (
    NEW.id,
    2.0,
    'monthly',
    true,
    true,
    false
  );

  RETURN NEW;
END;
$function$;

-- 2. Corriger les profils existants en copiant le téléphone depuis auth.users
UPDATE public.profiles p
SET phone = u.phone
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.phone IS NULL OR p.phone = '')
  AND u.phone IS NOT NULL
  AND u.phone != '';