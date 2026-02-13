
-- 1. Update handle_new_user() with city-based country inference fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
  user_city TEXT;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix Paul's profile
UPDATE profiles SET country_code = 'BJ'
WHERE user_id = '9bdeafea-3ad4-4369-8afd-a28e3e1243ab';

-- 3. Backfill: Fix existing profiles with CI default but identifiable non-CI cities
-- Bénin
UPDATE profiles SET country_code = 'BJ'
WHERE country_code = 'CI' AND (phone IS NULL OR phone = '')
AND (LOWER(city) LIKE '%cotonou%' OR LOWER(city) LIKE '%porto-novo%' OR LOWER(city) LIKE '%parakou%'
  OR LOWER(city) LIKE '%bohicon%' OR LOWER(city) LIKE '%abomey%' OR LOWER(city) LIKE '%natitingou%'
  OR LOWER(city) LIKE '%djougou%' OR LOWER(city) LIKE '%lokossa%' OR LOWER(city) LIKE '%ouidah%'
  OR LOWER(city) LIKE '%akpakpa%' OR LOWER(city) LIKE '%calavi%' OR LOWER(city) LIKE '%godomey%'
  OR LOWER(city) LIKE '%cadjehoun%' OR LOWER(city) LIKE '%fidjrosse%');

-- Sénégal
UPDATE profiles SET country_code = 'SN'
WHERE country_code = 'CI' AND (phone IS NULL OR phone = '')
AND (LOWER(city) LIKE '%dakar%' OR LOWER(city) LIKE '%thies%' OR LOWER(city) LIKE '%kaolack%'
  OR LOWER(city) LIKE '%saint-louis%' OR LOWER(city) LIKE '%ziguinchor%' OR LOWER(city) LIKE '%touba%'
  OR LOWER(city) LIKE '%rufisque%' OR LOWER(city) LIKE '%mbour%' OR LOWER(city) LIKE '%tambacounda%');

-- Togo
UPDATE profiles SET country_code = 'TG'
WHERE country_code = 'CI' AND (phone IS NULL OR phone = '')
AND (LOWER(city) LIKE '%lome%' OR LOWER(city) LIKE '%lomé%' OR LOWER(city) LIKE '%kara%'
  OR LOWER(city) LIKE '%sokode%' OR LOWER(city) LIKE '%sokodé%' OR LOWER(city) LIKE '%atakpame%'
  OR LOWER(city) LIKE '%kpalime%' OR LOWER(city) LIKE '%kpalimé%');

-- Mali
UPDATE profiles SET country_code = 'ML'
WHERE country_code = 'CI' AND (phone IS NULL OR phone = '')
AND (LOWER(city) LIKE '%bamako%' OR LOWER(city) LIKE '%sikasso%' OR LOWER(city) LIKE '%mopti%'
  OR LOWER(city) LIKE '%segou%' OR LOWER(city) LIKE '%ségou%' OR LOWER(city) LIKE '%koutiala%'
  OR LOWER(city) LIKE '%kayes%');

-- Burkina Faso
UPDATE profiles SET country_code = 'BF'
WHERE country_code = 'CI' AND (phone IS NULL OR phone = '')
AND (LOWER(city) LIKE '%ouagadougou%' OR LOWER(city) LIKE '%bobo-dioulasso%' OR LOWER(city) LIKE '%koudougou%'
  OR LOWER(city) LIKE '%ouahigouya%' OR LOWER(city) LIKE '%banfora%');
