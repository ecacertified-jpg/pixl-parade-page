-- Create table for reciprocity imbalance alerts
CREATE TABLE IF NOT EXISTS reciprocity_imbalance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'severe_imbalance',
  severity TEXT NOT NULL DEFAULT 'high',
  total_received NUMERIC NOT NULL DEFAULT 0,
  total_contributed NUMERIC NOT NULL DEFAULT 0,
  imbalance_ratio NUMERIC NOT NULL DEFAULT 0,
  contributions_received_count INTEGER NOT NULL DEFAULT 0,
  contributions_given_count INTEGER NOT NULL DEFAULT 0,
  days_since_last_contribution INTEGER,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_imbalance_alerts_user_id ON reciprocity_imbalance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_imbalance_alerts_status ON reciprocity_imbalance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_imbalance_alerts_severity ON reciprocity_imbalance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_imbalance_alerts_created_at ON reciprocity_imbalance_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE reciprocity_imbalance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view and manage alerts
CREATE POLICY "Admins can view imbalance alerts"
  ON reciprocity_imbalance_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can update imbalance alerts"
  ON reciprocity_imbalance_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "System can insert imbalance alerts"
  ON reciprocity_imbalance_alerts
  FOR INSERT
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_reciprocity_imbalance_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reciprocity_imbalance_alerts_timestamp
  BEFORE UPDATE ON reciprocity_imbalance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_reciprocity_imbalance_alerts_updated_at();

-- Add helpful comments
COMMENT ON TABLE reciprocity_imbalance_alerts IS 'Stores alerts for users with major reciprocity imbalances';
COMMENT ON COLUMN reciprocity_imbalance_alerts.imbalance_ratio IS 'Ratio of received to contributed (higher = more imbalanced)';
COMMENT ON COLUMN reciprocity_imbalance_alerts.severity IS 'Alert severity: low, medium, high, critical';
COMMENT ON COLUMN reciprocity_imbalance_alerts.status IS 'Alert status: pending, reviewed, resolved, dismissed';