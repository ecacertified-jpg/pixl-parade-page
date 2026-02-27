
-- Table de logs pour les envois de templates WhatsApp
CREATE TABLE public.whatsapp_template_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL,
  recipient_phone text NOT NULL,
  country_prefix text,
  language_code text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  body_params jsonb,
  button_params jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes du dashboard
CREATE INDEX idx_wa_tpl_logs_template_created ON public.whatsapp_template_logs (template_name, created_at DESC);
CREATE INDEX idx_wa_tpl_logs_country_created ON public.whatsapp_template_logs (country_prefix, created_at DESC);
CREATE INDEX idx_wa_tpl_logs_status_created ON public.whatsapp_template_logs (status, created_at DESC);

-- RLS : admin-only SELECT, pas d'INSERT côté client (service role uniquement)
ALTER TABLE public.whatsapp_template_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp template logs"
ON public.whatsapp_template_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RPC d'agrégation pour le dashboard
CREATE OR REPLACE FUNCTION public.get_whatsapp_template_stats(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  since_date timestamptz;
BEGIN
  -- Vérification admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  since_date := now() - (days_back || ' days')::interval;

  SELECT jsonb_build_object(
    'kpis', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'sent', COUNT(*) FILTER (WHERE status = 'sent'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'success_rate', CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE status = 'sent'))::numeric / COUNT(*)::numeric * 100, 1)
          ELSE 0 END,
        'templates_count', COUNT(DISTINCT template_name)
      )
      FROM whatsapp_template_logs WHERE created_at >= since_date
    ),
    'by_template', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT template_name,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'sent') as sent,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(*) FILTER (WHERE status = 'sent'))::numeric / COUNT(*)::numeric * 100, 1)
            ELSE 0 END as success_rate
        FROM whatsapp_template_logs WHERE created_at >= since_date
        GROUP BY template_name ORDER BY total DESC
      ) t
    ),
    'by_country', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT country_prefix,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'sent') as sent,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(*) FILTER (WHERE status = 'sent'))::numeric / COUNT(*)::numeric * 100, 1)
            ELSE 0 END as success_rate
        FROM whatsapp_template_logs WHERE created_at >= since_date
        GROUP BY country_prefix ORDER BY total DESC
      ) t
    ),
    'daily', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT (created_at AT TIME ZONE 'UTC')::date as day,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'sent') as sent,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM whatsapp_template_logs WHERE created_at >= since_date
        GROUP BY day ORDER BY day ASC
      ) t
    ),
    'top_errors', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT error_message, template_name,
          COUNT(*) as occurrences,
          MAX(created_at) as last_occurrence
        FROM whatsapp_template_logs
        WHERE created_at >= since_date AND status = 'failed' AND error_message IS NOT NULL
        GROUP BY error_message, template_name
        ORDER BY occurrences DESC
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
