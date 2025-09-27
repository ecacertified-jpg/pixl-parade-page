-- Add only the birthday column since city already exists
ALTER TABLE public.profiles 
ADD COLUMN birthday DATE;

-- Update the handle_new_user function to save birthday and city
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert with all available fields from user metadata
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
  RETURN NEW;
END;
$function$;