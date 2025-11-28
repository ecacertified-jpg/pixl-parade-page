-- Create table to track business registration history
CREATE TABLE IF NOT EXISTS business_registration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID,
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_type TEXT,
  action TEXT NOT NULL CHECK (action IN ('registered', 'approved', 'rejected')),
  rejection_reason TEXT,
  admin_user_id UUID REFERENCES admin_users(user_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_business_registration_logs_action ON business_registration_logs(action);
CREATE INDEX idx_business_registration_logs_created_at ON business_registration_logs(created_at DESC);
CREATE INDEX idx_business_registration_logs_admin_user_id ON business_registration_logs(admin_user_id);

-- Enable RLS
ALTER TABLE business_registration_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view registration logs"
  ON business_registration_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- Policy: System can insert logs
CREATE POLICY "System can insert registration logs"
  ON business_registration_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE business_registration_logs IS 'Historical log of all business account registrations, approvals, and rejections';