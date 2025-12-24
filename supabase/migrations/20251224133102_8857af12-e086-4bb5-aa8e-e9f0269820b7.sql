-- Table pour les préférences de rapports des admins
CREATE TABLE public.admin_report_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE CASCADE,
  report_types TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  email_override TEXT,
  include_kpis BOOLEAN NOT NULL DEFAULT true,
  include_charts_summary BOOLEAN NOT NULL DEFAULT true,
  include_alerts BOOLEAN NOT NULL DEFAULT true,
  include_top_performers BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT admin_report_preferences_admin_user_unique UNIQUE (admin_user_id)
);

-- Table pour l'historique des rapports envoyés
CREATE TABLE public.admin_report_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'partial', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_report_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_report_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_report_preferences
CREATE POLICY "Admins can view their own preferences"
ON public.admin_report_preferences FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admins can insert their own preferences"
ON public.admin_report_preferences FOR INSERT
WITH CHECK (
  auth.uid() = admin_user_id
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admins can update their own preferences"
ON public.admin_report_preferences FOR UPDATE
USING (
  auth.uid() = admin_user_id
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RLS Policies for admin_report_logs (read-only for admins)
CREATE POLICY "Admins can view report logs"
ON public.admin_report_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Allow edge function to insert logs (service role)
CREATE POLICY "Service role can insert logs"
ON public.admin_report_logs FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_admin_report_preferences_updated_at
BEFORE UPDATE ON public.admin_report_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_admin_report_preferences_admin_user ON public.admin_report_preferences(admin_user_id);
CREATE INDEX idx_admin_report_logs_type_date ON public.admin_report_logs(report_type, sent_at DESC);
CREATE INDEX idx_admin_report_logs_status ON public.admin_report_logs(status);