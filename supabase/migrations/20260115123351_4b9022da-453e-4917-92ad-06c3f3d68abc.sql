-- Table pour stocker les prévisions ML
CREATE TABLE ml_forecast_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'users', 'businesses', 'revenue', 'orders'
  forecast_year INTEGER NOT NULL,
  forecast_month INTEGER NOT NULL,
  predicted_value NUMERIC NOT NULL,
  lower_bound NUMERIC,
  upper_bound NUMERIC,
  confidence_score NUMERIC, -- 0-100
  model_version TEXT DEFAULT 'v1',
  
  -- ML insights
  trend_direction TEXT, -- 'up', 'down', 'stable'
  growth_momentum NUMERIC, -- -100 to +100
  seasonal_factor NUMERIC,
  anomaly_detected BOOLEAN DEFAULT false,
  risk_factors TEXT[],
  opportunities TEXT[],
  
  -- Facteurs explicatifs
  contributing_factors JSONB DEFAULT '{}',
  
  -- Analyse globale (stockée une fois par country/metric/year)
  overall_trend TEXT,
  seasonal_patterns TEXT[],
  model_confidence NUMERIC,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(country_code, metric_type, forecast_year, forecast_month, model_version)
);

-- Index pour performance
CREATE INDEX idx_ml_forecast_country ON ml_forecast_results(country_code);
CREATE INDEX idx_ml_forecast_metric ON ml_forecast_results(metric_type);
CREATE INDEX idx_ml_forecast_date ON ml_forecast_results(forecast_year, forecast_month);
CREATE INDEX idx_ml_forecast_expires ON ml_forecast_results(expires_at);
CREATE INDEX idx_ml_forecast_lookup ON ml_forecast_results(country_code, metric_type, forecast_year);

-- Enable RLS
ALTER TABLE ml_forecast_results ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent voir les prévisions ML
CREATE POLICY "Admins can view ML forecasts"
ON ml_forecast_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Politique: Les edge functions peuvent insérer/mettre à jour
CREATE POLICY "Service role can manage ML forecasts"
ON ml_forecast_results FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Commentaire sur la table
COMMENT ON TABLE ml_forecast_results IS 'Stockage des prévisions ML générées par Lovable AI pour anticiper les tendances de performance par pays';