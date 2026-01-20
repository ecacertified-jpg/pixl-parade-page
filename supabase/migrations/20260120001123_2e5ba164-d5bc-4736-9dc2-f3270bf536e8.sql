-- Table des alertes de viralité produit
CREATE TABLE product_virality_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  
  -- Type d'alerte
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'shares_milestone',
    'shares_spike',
    'conversions_milestone',
    'high_conversion_rate',
    'viral_trending'
  )),
  
  -- Sévérité
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'success')),
  
  -- Métriques
  current_shares INTEGER NOT NULL DEFAULT 0,
  current_clicks INTEGER NOT NULL DEFAULT 0,
  current_conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  
  -- Comparaison période précédente
  previous_shares INTEGER DEFAULT 0,
  share_growth_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Message et statut
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  milestone_value INTEGER,
  period_type TEXT,
  alert_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Éviter les doublons par jour
  UNIQUE(product_id, alert_type, milestone_value, alert_date)
);

-- Index pour performance
CREATE INDEX idx_product_virality_alerts_business ON product_virality_alerts(business_id, is_read);
CREATE INDEX idx_product_virality_alerts_product ON product_virality_alerts(product_id);
CREATE INDEX idx_product_virality_alerts_created ON product_virality_alerts(created_at DESC);

-- RLS
ALTER TABLE product_virality_alerts ENABLE ROW LEVEL SECURITY;

-- Vendeurs voient leurs propres alertes
CREATE POLICY "Business owners can view their virality alerts"
ON product_virality_alerts FOR SELECT
USING (
  business_id IN (
    SELECT id FROM business_accounts WHERE user_id = auth.uid()
  )
);

-- Vendeurs peuvent mettre à jour leurs alertes (marquer comme lu)
CREATE POLICY "Business owners can update their virality alerts"
ON product_virality_alerts FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM business_accounts WHERE user_id = auth.uid()
  )
);

-- Admins voient tout
CREATE POLICY "Admins can view all virality alerts"
ON product_virality_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Table de configuration des seuils
CREATE TABLE virality_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'shares_count',
    'shares_spike',
    'conversions_count',
    'conversion_rate'
  )),
  
  milestone_values INTEGER[] DEFAULT '{10, 25, 50, 100, 250, 500, 1000}',
  spike_percentage INTEGER DEFAULT 100,
  min_conversion_rate NUMERIC(5,2) DEFAULT 15.0,
  
  period_type TEXT DEFAULT 'week',
  
  is_active BOOLEAN DEFAULT TRUE,
  notify_business BOOLEAN DEFAULT TRUE,
  notify_admin BOOLEAN DEFAULT FALSE,
  
  min_delay_hours INTEGER DEFAULT 24,
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour thresholds
ALTER TABLE virality_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les thresholds
CREATE POLICY "Anyone can read virality thresholds"
ON virality_alert_thresholds FOR SELECT
USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage virality thresholds"
ON virality_alert_thresholds FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Insérer les seuils par défaut
INSERT INTO virality_alert_thresholds (metric_type, milestone_values, description) VALUES
('shares_count', '{10, 25, 50, 100, 250, 500, 1000}', 'Alertes de jalons de partages'),
('shares_spike', NULL, 'Alertes de pics de partages (+100% en 24h)'),
('conversions_count', '{5, 10, 25, 50, 100}', 'Alertes de jalons de conversions'),
('conversion_rate', NULL, 'Alertes de taux de conversion exceptionnel (>15%)');