-- Modifier le trigger handle_new_user pour créer des préférences de réciprocité par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile with all available fields from user metadata
  INSERT INTO public.profiles (user_id, first_name, last_name, birthday, city)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthday')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'city'
  );

  -- Créer les préférences de réciprocité par défaut
  INSERT INTO public.user_reciprocity_preferences (
    user_id,
    enable_reciprocity_system,
    enable_for_birthdays,
    enable_for_academic,
    enable_for_weddings,
    enable_for_promotions,
    show_generosity_badge
  ) VALUES (
    NEW.id,
    true,   -- Système activé par défaut
    true,   -- Anniversaires activés
    false,  -- Réussites académiques désactivées par défaut
    false,  -- Mariages désactivés par défaut
    false,  -- Promotions désactivées par défaut
    true    -- Badge de générosité visible par défaut
  );

  RETURN NEW;
END;
$function$;