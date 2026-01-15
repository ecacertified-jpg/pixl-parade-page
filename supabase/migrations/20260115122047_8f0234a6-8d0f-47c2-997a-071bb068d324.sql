-- Table pour tracker l'état de difficulté des pays
CREATE TABLE country_struggling_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  is_struggling BOOLEAN DEFAULT false,
  struggling_since TIMESTAMP WITH TIME ZONE,
  last_status_change TIMESTAMP WITH TIME ZONE,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  struggling_metrics TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_country_struggling_code ON country_struggling_status(country_code);
CREATE INDEX idx_country_struggling_status ON country_struggling_status(is_struggling);

-- RLS
ALTER TABLE country_struggling_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view struggling status"
ON country_struggling_status FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Service role can manage struggling status"
ON country_struggling_status FOR ALL
USING (auth.role() = 'service_role');

-- Ajouter la préférence admin pour les alertes pays en difficulté
ALTER TABLE admin_notification_preferences 
ADD COLUMN IF NOT EXISTS struggling_country_alerts BOOLEAN DEFAULT true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_country_struggling_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_country_struggling_status_updated_at
  BEFORE UPDATE ON country_struggling_status
  FOR EACH ROW
  EXECUTE FUNCTION update_country_struggling_status_updated_at();