-- Step 1: Fix status inconsistencies - set status to 'active' for accounts that are already active
UPDATE business_accounts 
SET status = 'active' 
WHERE is_active = true AND status = 'pending';

-- Step 2: Rename duplicate "Eca certified" accounts to make them unique
UPDATE business_accounts 
SET business_name = 'Eca certified - Parfumerie'
WHERE id = '3179790d-ec3f-4b56-be92-20a74e91481a';

UPDATE business_accounts 
SET business_name = 'Eca certified - Tech'
WHERE id = '37fb4a5b-d6e3-43ca-b938-4d98ed3e2c20';

-- Step 3: Create unique index to prevent future duplicate business names
CREATE UNIQUE INDEX IF NOT EXISTS unique_business_name_active 
ON business_accounts (LOWER(TRIM(business_name))) 
WHERE status IN ('pending', 'active', 'resubmitted');