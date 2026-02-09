-- Corriger les profils avec numéro béninois
UPDATE profiles 
SET country_code = 'BJ' 
WHERE phone LIKE '+229%' AND country_code != 'BJ';

-- Corriger les profils avec numéro sénégalais
UPDATE profiles 
SET country_code = 'SN' 
WHERE phone LIKE '+221%' AND country_code != 'SN';

-- Propager aux business_accounts
UPDATE business_accounts ba
SET country_code = p.country_code
FROM profiles p
WHERE ba.user_id = p.user_id
AND ba.country_code != p.country_code;