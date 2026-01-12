-- Corriger la fonction handle_new_user pour utiliser les bonnes colonnes de user_reciprocity_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    COALESCE(
      NEW.raw_user_meta_data ->> 'phone',
      NEW.phone
    )
  );

  -- Créer les préférences de réciprocité par défaut avec les colonnes existantes
  INSERT INTO public.user_reciprocity_preferences (
    user_id,
    enable_reciprocity_system,
    enable_for_birthdays,
    enable_for_academic,
    enable_for_weddings,
    enable_for_promotions,
    show_generosity_badge,
    notify_on_friend_fund,
    min_reciprocity_score,
    notify_high_priority_only
  )
  VALUES (
    NEW.id,
    true,   -- enable_reciprocity_system
    true,   -- enable_for_birthdays
    true,   -- enable_for_academic
    true,   -- enable_for_weddings
    true,   -- enable_for_promotions
    true,   -- show_generosity_badge
    true,   -- notify_on_friend_fund
    0,      -- min_reciprocity_score
    false   -- notify_high_priority_only
  );

  RETURN NEW;
END;
$$;