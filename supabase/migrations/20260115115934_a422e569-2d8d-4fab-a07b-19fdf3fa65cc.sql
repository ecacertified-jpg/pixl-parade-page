-- Table pour les alertes d'objectifs pays non atteints
CREATE TABLE public.country_objective_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  achievement_rate NUMERIC NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'objective_not_met',
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  
  -- Contrainte unique pour éviter les doublons
  CONSTRAINT unique_objective_alert UNIQUE (country_code, year, month, metric_type)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_country_objective_alerts_country ON public.country_objective_alerts(country_code);
CREATE INDEX idx_country_objective_alerts_period ON public.country_objective_alerts(year, month);
CREATE INDEX idx_country_objective_alerts_status ON public.country_objective_alerts(is_read, is_dismissed);
CREATE INDEX idx_country_objective_alerts_severity ON public.country_objective_alerts(severity);

-- Activer RLS
ALTER TABLE public.country_objective_alerts ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent voir les alertes
CREATE POLICY "Admins can view objective alerts"
ON public.country_objective_alerts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true
));

-- Politique: Système peut insérer des alertes (via service role)
CREATE POLICY "System can insert objective alerts"
ON public.country_objective_alerts FOR INSERT
WITH CHECK (true);

-- Politique: Admins peuvent mettre à jour les alertes
CREATE POLICY "Admins can update objective alerts"
ON public.country_objective_alerts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true
));

-- Politique: Admins peuvent supprimer les alertes
CREATE POLICY "Admins can delete objective alerts"
ON public.country_objective_alerts FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true
));