
CREATE OR REPLACE FUNCTION public.get_messaging_delivery_stats(days_back integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  admin_check boolean;
BEGIN
  -- Verify caller is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  ) INTO admin_check;

  IF NOT admin_check THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT json_build_object(
    'kpis', (
      SELECT json_build_object(
        'total_sent', count(*) FILTER (WHERE status = 'sent'),
        'total_failed', count(*) FILTER (WHERE status = 'failed'),
        'total', count(*),
        'whatsapp_sent', count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'sent'),
        'whatsapp_failed', count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'failed'),
        'sms_sent', count(*) FILTER (WHERE channel = 'sms' AND status = 'sent'),
        'sms_failed', count(*) FILTER (WHERE channel = 'sms' AND status = 'failed'),
        'whatsapp_success_rate', CASE
          WHEN count(*) FILTER (WHERE channel = 'whatsapp') > 0
          THEN round((count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'sent')::numeric / count(*) FILTER (WHERE channel = 'whatsapp') * 100), 1)
          ELSE 0 END,
        'sms_success_rate', CASE
          WHEN count(*) FILTER (WHERE channel = 'sms') > 0
          THEN round((count(*) FILTER (WHERE channel = 'sms' AND status = 'sent')::numeric / count(*) FILTER (WHERE channel = 'sms') * 100), 1)
          ELSE 0 END
      )
      FROM birthday_contact_alerts
      WHERE created_at >= now() - make_interval(days => days_back)
    ),
    'daily', (
      SELECT coalesce(json_agg(row_to_json(d) ORDER BY d.date), '[]'::json)
      FROM (
        SELECT
          date_trunc('day', created_at)::date AS date,
          count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'sent') AS whatsapp_sent,
          count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'failed') AS whatsapp_failed,
          count(*) FILTER (WHERE channel = 'sms' AND status = 'sent') AS sms_sent,
          count(*) FILTER (WHERE channel = 'sms' AND status = 'failed') AS sms_failed
        FROM birthday_contact_alerts
        WHERE created_at >= now() - make_interval(days => days_back)
        GROUP BY date_trunc('day', created_at)::date
      ) d
    ),
    'by_alert_type', (
      SELECT coalesce(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT
          alert_type,
          count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'sent') AS wa_sent,
          count(*) FILTER (WHERE channel = 'whatsapp' AND status = 'failed') AS wa_failed,
          count(*) FILTER (WHERE channel = 'sms' AND status = 'sent') AS sms_sent,
          count(*) FILTER (WHERE channel = 'sms' AND status = 'failed') AS sms_failed,
          count(*) AS total,
          CASE WHEN count(*) > 0
            THEN round((count(*) FILTER (WHERE status = 'sent')::numeric / count(*) * 100), 1)
            ELSE 0 END AS success_rate
        FROM birthday_contact_alerts
        WHERE created_at >= now() - make_interval(days => days_back)
        GROUP BY alert_type
        ORDER BY total DESC
      ) a
    ),
    'by_country', (
      SELECT coalesce(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT
          left(contact_phone, 4) AS country_prefix,
          count(*) AS total,
          count(*) FILTER (WHERE status = 'sent') AS sent,
          count(*) FILTER (WHERE status = 'failed') AS failed,
          count(*) FILTER (WHERE channel = 'whatsapp') AS whatsapp_count,
          count(*) FILTER (WHERE channel = 'sms') AS sms_count,
          CASE WHEN count(*) > 0
            THEN round((count(*) FILTER (WHERE status = 'sent')::numeric / count(*) * 100), 1)
            ELSE 0 END AS success_rate
        FROM birthday_contact_alerts
        WHERE created_at >= now() - make_interval(days => days_back)
        GROUP BY left(contact_phone, 4)
        ORDER BY total DESC
      ) c
    ),
    'top_errors', (
      SELECT coalesce(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT
          coalesce(error_message, 'N/A') AS error_message,
          channel,
          count(*) AS occurrences,
          max(created_at) AS last_occurrence
        FROM birthday_contact_alerts
        WHERE created_at >= now() - make_interval(days => days_back)
          AND status = 'failed'
        GROUP BY error_message, channel
        ORDER BY occurrences DESC
        LIMIT 10
      ) e
    )
  ) INTO result;

  RETURN result;
END;
$$;
