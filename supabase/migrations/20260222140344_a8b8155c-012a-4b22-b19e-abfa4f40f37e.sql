
-- RPC function for admin-only WhatsApp OTP statistics
CREATE OR REPLACE FUNCTION public.get_whatsapp_otp_stats(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_sent bigint;
  total_verified bigint;
  total_expired bigint;
  avg_verification_seconds numeric;
  avg_attempts numeric;
  daily_data jsonb;
  country_data jsonb;
  recent_otps jsonb;
  cutoff_date timestamptz;
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  cutoff_date := now() - (days_back || ' days')::interval;

  -- Total sent
  SELECT count(*) INTO total_sent
  FROM whatsapp_otp_codes
  WHERE created_at >= cutoff_date;

  -- Total verified
  SELECT count(*) INTO total_verified
  FROM whatsapp_otp_codes
  WHERE created_at >= cutoff_date AND verified_at IS NOT NULL;

  -- Total expired (not verified and past expiry)
  SELECT count(*) INTO total_expired
  FROM whatsapp_otp_codes
  WHERE created_at >= cutoff_date AND verified_at IS NULL AND expires_at < now();

  -- Average verification time in seconds
  SELECT COALESCE(avg(EXTRACT(EPOCH FROM (verified_at - created_at))), 0)
  INTO avg_verification_seconds
  FROM whatsapp_otp_codes
  WHERE created_at >= cutoff_date AND verified_at IS NOT NULL;

  -- Average attempts before success
  SELECT COALESCE(avg(attempts), 0)
  INTO avg_attempts
  FROM whatsapp_otp_codes
  WHERE created_at >= cutoff_date AND verified_at IS NOT NULL;

  -- Daily breakdown
  SELECT COALESCE(jsonb_agg(row_to_json(d)::jsonb ORDER BY d.date), '[]'::jsonb)
  INTO daily_data
  FROM (
    SELECT
      date_trunc('day', created_at)::date AS date,
      count(*) AS sent,
      count(*) FILTER (WHERE verified_at IS NOT NULL) AS verified
    FROM whatsapp_otp_codes
    WHERE created_at >= cutoff_date
    GROUP BY date_trunc('day', created_at)::date
  ) d;

  -- Country breakdown by phone prefix
  SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb), '[]'::jsonb)
  INTO country_data
  FROM (
    SELECT
      CASE
        WHEN phone LIKE '+225%' THEN 'CI'
        WHEN phone LIKE '+229%' THEN 'BJ'
        WHEN phone LIKE '+221%' THEN 'SN'
        WHEN phone LIKE '+228%' THEN 'TG'
        WHEN phone LIKE '+223%' THEN 'ML'
        WHEN phone LIKE '+226%' THEN 'BF'
        ELSE 'OTHER'
      END AS country_code,
      count(*) AS total,
      count(*) FILTER (WHERE verified_at IS NOT NULL) AS verified
    FROM whatsapp_otp_codes
    WHERE created_at >= cutoff_date
    GROUP BY 1
  ) c;

  -- Recent OTPs (last 20, no code exposed)
  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO recent_otps
  FROM (
    SELECT
      id,
      phone,
      created_at,
      verified_at,
      expires_at,
      attempts,
      CASE
        WHEN verified_at IS NOT NULL THEN 'verified'
        WHEN expires_at < now() THEN 'expired'
        ELSE 'pending'
      END AS status,
      CASE WHEN verified_at IS NOT NULL
        THEN ROUND(EXTRACT(EPOCH FROM (verified_at - created_at)))
        ELSE NULL
      END AS verification_seconds
    FROM whatsapp_otp_codes
    WHERE created_at >= cutoff_date
    ORDER BY created_at DESC
    LIMIT 20
  ) r;

  result := jsonb_build_object(
    'total_sent', total_sent,
    'total_verified', total_verified,
    'total_expired', total_expired,
    'success_rate', CASE WHEN total_sent > 0 THEN ROUND((total_verified::numeric / total_sent) * 100, 1) ELSE 0 END,
    'avg_verification_seconds', ROUND(avg_verification_seconds, 1),
    'avg_attempts', ROUND(avg_attempts, 1),
    'daily', daily_data,
    'by_country', country_data,
    'recent', recent_otps
  );

  RETURN result;
END;
$$;
