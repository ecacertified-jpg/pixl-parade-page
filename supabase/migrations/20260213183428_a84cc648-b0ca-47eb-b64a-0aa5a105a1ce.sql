
-- Enrichir le trigger sync_business_country_from_profile avec inference par adresse et telephone
CREATE OR REPLACE FUNCTION public.sync_business_country_from_profile()
RETURNS trigger AS $$
DECLARE
  profile_country TEXT;
  business_address TEXT;
  business_phone TEXT;
BEGIN
  -- Step 1: Get country from owner's profile
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    SELECT country_code INTO profile_country
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    IF profile_country IS NOT NULL THEN
      NEW.country_code := profile_country;
    END IF;
  END IF;
  
  -- Step 2: If still CI or NULL, infer from business address
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    business_address := LOWER(COALESCE(NEW.address, ''));
    
    IF business_address LIKE '%cotonou%' OR business_address LIKE '%porto-novo%' 
       OR business_address LIKE '%parakou%' OR business_address LIKE '%bohicon%'
       OR business_address LIKE '%abomey%' OR business_address LIKE '%ouidah%'
       OR business_address LIKE '%calavi%' THEN
      NEW.country_code := 'BJ';
    ELSIF business_address LIKE '%dakar%' OR business_address LIKE '%thies%'
       OR business_address LIKE '%kaolack%' OR business_address LIKE '%saint-louis%'
       OR business_address LIKE '%ziguinchor%' OR business_address LIKE '%touba%'
       OR business_address LIKE '%mbour%' THEN
      NEW.country_code := 'SN';
    ELSIF business_address LIKE '%lome%' OR business_address LIKE '%lomé%'
       OR business_address LIKE '%kara%' OR business_address LIKE '%sokode%'
       OR business_address LIKE '%sokodé%' OR business_address LIKE '%atakpame%'
       OR business_address LIKE '%kpalime%' OR business_address LIKE '%kpalimé%' THEN
      NEW.country_code := 'TG';
    ELSIF business_address LIKE '%bamako%' OR business_address LIKE '%sikasso%'
       OR business_address LIKE '%mopti%' OR business_address LIKE '%segou%'
       OR business_address LIKE '%ségou%' OR business_address LIKE '%koutiala%'
       OR business_address LIKE '%kayes%' THEN
      NEW.country_code := 'ML';
    ELSIF business_address LIKE '%ouagadougou%' OR business_address LIKE '%bobo-dioulasso%'
       OR business_address LIKE '%koudougou%' OR business_address LIKE '%ouahigouya%'
       OR business_address LIKE '%banfora%' THEN
      NEW.country_code := 'BF';
    END IF;
  END IF;
  
  -- Step 3: If still CI or NULL, try phone prefix
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    business_phone := COALESCE(NEW.phone, '');
    NEW.country_code := CASE
      WHEN business_phone LIKE '+229%' THEN 'BJ'
      WHEN business_phone LIKE '+221%' THEN 'SN'
      WHEN business_phone LIKE '+228%' THEN 'TG'
      WHEN business_phone LIKE '+223%' THEN 'ML'
      WHEN business_phone LIKE '+226%' THEN 'BF'
      ELSE COALESCE(NEW.country_code, 'CI')
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corriger les donnees existantes: business accounts avec country_code='CI' mais adresse d'un autre pays
UPDATE business_accounts SET country_code = 'BJ'
WHERE (country_code = 'CI' OR country_code IS NULL)
AND (LOWER(address) LIKE '%cotonou%' OR LOWER(address) LIKE '%porto-novo%'
  OR LOWER(address) LIKE '%parakou%' OR LOWER(address) LIKE '%bohicon%'
  OR LOWER(address) LIKE '%abomey%' OR LOWER(address) LIKE '%ouidah%'
  OR LOWER(address) LIKE '%calavi%');

UPDATE business_accounts SET country_code = 'SN'
WHERE (country_code = 'CI' OR country_code IS NULL)
AND (LOWER(address) LIKE '%dakar%' OR LOWER(address) LIKE '%thies%'
  OR LOWER(address) LIKE '%kaolack%' OR LOWER(address) LIKE '%saint-louis%'
  OR LOWER(address) LIKE '%ziguinchor%' OR LOWER(address) LIKE '%touba%'
  OR LOWER(address) LIKE '%mbour%');

UPDATE business_accounts SET country_code = 'TG'
WHERE (country_code = 'CI' OR country_code IS NULL)
AND (LOWER(address) LIKE '%lome%' OR LOWER(address) LIKE '%lomé%'
  OR LOWER(address) LIKE '%kara%' OR LOWER(address) LIKE '%sokode%'
  OR LOWER(address) LIKE '%sokodé%');

UPDATE business_accounts SET country_code = 'ML'
WHERE (country_code = 'CI' OR country_code IS NULL)
AND (LOWER(address) LIKE '%bamako%' OR LOWER(address) LIKE '%sikasso%'
  OR LOWER(address) LIKE '%mopti%' OR LOWER(address) LIKE '%segou%'
  OR LOWER(address) LIKE '%ségou%');

UPDATE business_accounts SET country_code = 'BF'
WHERE (country_code = 'CI' OR country_code IS NULL)
AND (LOWER(address) LIKE '%ouagadougou%' OR LOWER(address) LIKE '%bobo-dioulasso%'
  OR LOWER(address) LIKE '%koudougou%' OR LOWER(address) LIKE '%ouahigouya%'
  OR LOWER(address) LIKE '%banfora%');

-- Aussi corriger par prefixe telephone si adresse n'a pas matché
UPDATE business_accounts SET country_code = 'BJ'
WHERE (country_code = 'CI' OR country_code IS NULL) AND phone LIKE '+229%';

UPDATE business_accounts SET country_code = 'SN'
WHERE (country_code = 'CI' OR country_code IS NULL) AND phone LIKE '+221%';

UPDATE business_accounts SET country_code = 'TG'
WHERE (country_code = 'CI' OR country_code IS NULL) AND phone LIKE '+228%';

UPDATE business_accounts SET country_code = 'ML'
WHERE (country_code = 'CI' OR country_code IS NULL) AND phone LIKE '+223%';

UPDATE business_accounts SET country_code = 'BF'
WHERE (country_code = 'CI' OR country_code IS NULL) AND phone LIKE '+226%';

-- Synchroniser les produits avec le nouveau country_code de leur boutique
UPDATE products p SET country_code = ba.country_code
FROM business_accounts ba
WHERE p.business_account_id = ba.id
AND p.country_code IS DISTINCT FROM ba.country_code;
