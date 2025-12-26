-- Drop the old check constraint
ALTER TABLE public.business_accounts DROP CONSTRAINT IF EXISTS business_accounts_status_check;

-- Add the new check constraint with 'approved' included
ALTER TABLE public.business_accounts ADD CONSTRAINT business_accounts_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'active'::text, 'rejected'::text, 'resubmitted'::text]));