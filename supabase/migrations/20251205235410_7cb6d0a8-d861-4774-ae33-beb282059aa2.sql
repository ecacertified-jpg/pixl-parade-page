-- Backfill business_registration_logs for existing active accounts
INSERT INTO business_registration_logs (
  business_account_id,
  business_name,
  business_email,
  business_type,
  action,
  admin_user_id,
  created_at
)
SELECT 
  ba.id,
  ba.business_name,
  ba.email,
  ba.business_type,
  'approved',
  NULL, -- No admin since it was done via migration
  ba.created_at
FROM business_accounts ba
WHERE ba.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM business_registration_logs brl 
  WHERE brl.business_account_id = ba.id 
  AND brl.action = 'approved'
);