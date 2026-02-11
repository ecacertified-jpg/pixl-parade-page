-- Corriger les profils +229 marqués CI → BJ (Bénin)
UPDATE profiles 
SET country_code = 'BJ' 
WHERE phone LIKE '+229%' AND country_code = 'CI';

-- Corriger les profils +221 marqués CI → SN (Sénégal)
UPDATE profiles 
SET country_code = 'SN' 
WHERE phone LIKE '+221%' AND country_code = 'CI';

-- Propager les corrections aux boutiques
UPDATE business_accounts ba
SET country_code = p.country_code
FROM profiles p
WHERE ba.user_id = p.user_id
AND ba.country_code != p.country_code;