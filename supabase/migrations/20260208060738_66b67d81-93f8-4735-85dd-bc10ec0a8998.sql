
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
BEGIN
  phone_number := COALESCE(
    NEW.raw_user_meta_data ->> 'phone',
    NEW.phone
  );
  
  detected_country := CASE
    WHEN phone_number LIKE '+229%' THEN 'BJ'
    WHEN phone_number LIKE '+221%' THEN 'SN'
    WHEN phone_number LIKE '+225%' THEN 'CI'
    ELSE 'CI'
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
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_reciprocity_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
