-- Add rejection tracking fields to business_accounts
ALTER TABLE business_accounts 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS corrections_message TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'resubmitted'));

-- Update existing records to have proper status
UPDATE business_accounts 
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'pending'
END
WHERE status IS NULL;

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_business_accounts_status ON business_accounts(status);

COMMENT ON COLUMN business_accounts.rejection_reason IS 'Reason for rejection if business was rejected';
COMMENT ON COLUMN business_accounts.rejection_date IS 'Date when business was rejected';
COMMENT ON COLUMN business_accounts.resubmission_count IS 'Number of times business resubmitted after rejection';
COMMENT ON COLUMN business_accounts.corrections_message IS 'Message from business explaining corrections made after rejection';
COMMENT ON COLUMN business_accounts.status IS 'Current status: pending (awaiting approval), active (approved), rejected (denied), resubmitted (resubmitted after rejection)';