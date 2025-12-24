-- Add escalation columns to admin_growth_alerts
ALTER TABLE admin_growth_alerts 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'info',
ADD COLUMN IF NOT EXISTS escalation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_escalated_at timestamptz,
ADD COLUMN IF NOT EXISTS original_severity text;

-- Add escalation columns to business_performance_alerts (severity already exists)
ALTER TABLE business_performance_alerts 
ADD COLUMN IF NOT EXISTS escalation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_escalated_at timestamptz,
ADD COLUMN IF NOT EXISTS original_severity text;

-- Update existing alerts to set original_severity based on current severity
UPDATE admin_growth_alerts 
SET original_severity = COALESCE(severity, 'info'),
    severity = COALESCE(severity, 'info')
WHERE original_severity IS NULL;

UPDATE business_performance_alerts 
SET original_severity = COALESCE(severity, 'warning')
WHERE original_severity IS NULL;