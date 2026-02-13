-- Synchronize product country_code with their parent business
UPDATE products p
SET country_code = ba.country_code
FROM business_accounts ba
WHERE p.business_account_id = ba.id
  AND p.country_code IS DISTINCT FROM ba.country_code;