-- Add country_code and related_notification_id to admin_audit_logs
ALTER TABLE admin_audit_logs
ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE admin_audit_logs
ADD COLUMN IF NOT EXISTS related_notification_id UUID REFERENCES admin_notifications(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_country 
ON admin_audit_logs(country_code);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_notification 
ON admin_audit_logs(related_notification_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created 
ON admin_audit_logs(admin_user_id, created_at DESC);

-- Add comments
COMMENT ON COLUMN admin_audit_logs.country_code IS 'Country code for filtering actions by country (e.g., CI, SN, BJ)';
COMMENT ON COLUMN admin_audit_logs.related_notification_id IS 'Reference to the notification this action responded to, for response time calculation';