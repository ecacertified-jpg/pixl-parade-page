
-- Insérer le seuil par défaut pour le monitoring OTP WhatsApp
INSERT INTO public.growth_alert_thresholds (
  metric_type,
  threshold_type,
  threshold_value,
  comparison_period,
  is_active,
  notify_methods
) VALUES (
  'whatsapp_otp_success_rate',
  'minimum_percentage',
  80,
  '1h',
  true,
  '["in_app", "email"]'::jsonb
);

-- Créer le CRON job pour vérifier la santé OTP toutes les heures
SELECT cron.schedule(
  'check-whatsapp-otp-health-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/check-whatsapp-otp-health',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
