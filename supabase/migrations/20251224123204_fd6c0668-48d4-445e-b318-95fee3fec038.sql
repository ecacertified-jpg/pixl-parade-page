-- Table pour stocker les alertes de performance business
CREATE TABLE public.business_performance_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('revenue_drop', 'orders_drop', 'inactivity', 'rating_drop', 'conversion_drop')),
    metric_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
    current_value NUMERIC NOT NULL DEFAULT 0,
    previous_value NUMERIC,
    change_percentage NUMERIC,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour configurer les seuils d'alerte
CREATE TABLE public.business_alert_thresholds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL UNIQUE CHECK (metric_type IN ('revenue', 'orders', 'inactivity', 'rating', 'conversion_rate')),
    threshold_type TEXT NOT NULL DEFAULT 'percentage_drop' CHECK (threshold_type IN ('percentage_drop', 'absolute_drop', 'inactivity_days')),
    warning_threshold NUMERIC NOT NULL,
    critical_threshold NUMERIC NOT NULL,
    comparison_period TEXT NOT NULL DEFAULT 'week' CHECK (comparison_period IN ('day', 'week', 'month', 'quarter')),
    is_active BOOLEAN DEFAULT true,
    notify_business BOOLEAN DEFAULT false,
    notify_admin BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_business_performance_alerts_business_id ON public.business_performance_alerts(business_id);
CREATE INDEX idx_business_performance_alerts_severity ON public.business_performance_alerts(severity);
CREATE INDEX idx_business_performance_alerts_is_read ON public.business_performance_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_business_performance_alerts_created_at ON public.business_performance_alerts(created_at DESC);

-- Activer RLS
ALTER TABLE public.business_performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Policies pour business_performance_alerts (admins uniquement)
CREATE POLICY "Admins can view all business alerts"
ON public.business_performance_alerts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Admins can update business alerts"
ON public.business_performance_alerts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "System can insert business alerts"
ON public.business_performance_alerts FOR INSERT
WITH CHECK (true);

-- Policies pour business_alert_thresholds (admins uniquement)
CREATE POLICY "Admins can view alert thresholds"
ON public.business_alert_thresholds FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Admins can manage alert thresholds"
ON public.business_alert_thresholds FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Insérer les seuils par défaut
INSERT INTO public.business_alert_thresholds (metric_type, threshold_type, warning_threshold, critical_threshold, comparison_period, description) VALUES
    ('revenue', 'percentage_drop', 20, 50, 'week', 'Baisse du chiffre d''affaires par rapport à la période précédente'),
    ('orders', 'percentage_drop', 30, 60, 'week', 'Baisse du nombre de commandes par rapport à la période précédente'),
    ('inactivity', 'inactivity_days', 14, 30, 'day', 'Nombre de jours sans aucune commande'),
    ('rating', 'absolute_drop', 0.5, 1.0, 'month', 'Baisse de la note moyenne des avis clients'),
    ('conversion_rate', 'percentage_drop', 15, 30, 'week', 'Baisse du taux de conversion (commandes confirmées/total)');

-- Trigger pour updated_at
CREATE TRIGGER update_business_alert_thresholds_updated_at
BEFORE UPDATE ON public.business_alert_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();