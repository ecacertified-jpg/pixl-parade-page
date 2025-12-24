-- Table pour stocker les seuils de croissance configurables
CREATE TABLE public.growth_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'users', 'businesses', 'revenue', 'orders'
  threshold_type TEXT NOT NULL, -- 'absolute', 'percentage', 'daily_count'
  threshold_value NUMERIC NOT NULL,
  comparison_period TEXT DEFAULT 'day', -- 'day', 'week', 'month'
  is_active BOOLEAN DEFAULT true,
  notify_methods JSONB DEFAULT '["in_app"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour stocker les alertes déclenchées
CREATE TABLE public.admin_growth_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_id UUID REFERENCES public.growth_alert_thresholds(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- 'milestone', 'growth_spike', 'daily_record'
  metric_type TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  previous_value NUMERIC,
  growth_percentage NUMERIC,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.growth_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_growth_alerts ENABLE ROW LEVEL SECURITY;

-- Policies: Seuls les admins peuvent voir/modifier
CREATE POLICY "Admins can view thresholds" ON public.growth_alert_thresholds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Super admins can manage thresholds" ON public.growth_alert_thresholds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true AND role = 'super_admin')
  );

CREATE POLICY "Admins can view alerts" ON public.admin_growth_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can update alerts" ON public.admin_growth_alerts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "System can insert alerts" ON public.admin_growth_alerts
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_growth_thresholds_active ON public.growth_alert_thresholds(is_active);
CREATE INDEX idx_growth_alerts_unread ON public.admin_growth_alerts(is_read, is_dismissed);
CREATE INDEX idx_growth_alerts_triggered ON public.admin_growth_alerts(triggered_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_growth_thresholds_updated_at
  BEFORE UPDATE ON public.growth_alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les seuils par défaut
INSERT INTO public.growth_alert_thresholds (metric_type, threshold_type, threshold_value, comparison_period) VALUES
  ('users', 'daily_count', 10, 'day'),
  ('users', 'percentage', 50, 'week'),
  ('businesses', 'daily_count', 5, 'day'),
  ('businesses', 'percentage', 100, 'week'),
  ('users', 'absolute', 100, 'day'),
  ('users', 'absolute', 500, 'day'),
  ('users', 'absolute', 1000, 'day');