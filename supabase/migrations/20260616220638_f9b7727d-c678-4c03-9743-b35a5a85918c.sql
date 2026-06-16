SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'notify-premium-trial-phases-daily';

SELECT cron.schedule(
  'notify-premium-trial-phases-daily',
  '0 9 * * *',
  $$SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-premium-trial-phases',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI3ODAyNiwiZXhwIjoyMDY4ODU0MDI2fQ.-Z7HmKaVDlOvkzgycrL10b9dZCr7RFd3OiZj6giCrxk"}'::jsonb,
    body := '{}'::jsonb
  );$$
);