-- Create table for tracking merged user accounts
CREATE TABLE public.user_account_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL,
  secondary_user_id uuid NOT NULL,
  primary_name text,
  secondary_name text,
  merged_at timestamp with time zone DEFAULT now(),
  merged_by uuid,
  data_transferred jsonb,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Ensure we don't merge the same accounts twice
  CONSTRAINT unique_merge_pair UNIQUE (primary_user_id, secondary_user_id)
);

-- Enable RLS
ALTER TABLE public.user_account_merges ENABLE ROW LEVEL SECURITY;

-- Only admins can view merge history
CREATE POLICY "Admins can view merge history"
ON public.user_account_merges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Only super_admins can insert merge records (done via edge function with service role)
CREATE POLICY "Super admins can insert merge records"
ON public.user_account_merges
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- Create index for faster lookups
CREATE INDEX idx_user_account_merges_primary ON public.user_account_merges(primary_user_id);
CREATE INDEX idx_user_account_merges_secondary ON public.user_account_merges(secondary_user_id);
CREATE INDEX idx_user_account_merges_merged_at ON public.user_account_merges(merged_at DESC);