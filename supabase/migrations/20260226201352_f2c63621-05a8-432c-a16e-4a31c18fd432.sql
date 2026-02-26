-- Insert default threshold for WhatsApp delivery failure rate
INSERT INTO growth_alert_thresholds (metric_type, threshold_type, threshold_value, comparison_period, is_active, notify_methods)
VALUES ('whatsapp_delivery_failure_rate', 'percentage', 10, '24h', true, '["in_app", "email"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create CRON job to check WhatsApp delivery health every 6 hours
SELECT cron.schedule(
  'check-whatsapp-delivery-health-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/check-whatsapp-delivery-health',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);