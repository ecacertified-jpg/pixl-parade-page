SELECT cron.schedule(
  'birthday-wishes-daily',
  '1 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-wishes',
    headers:=jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI3ODAyNiwiZXhwIjoyMDY4ODU0MDI2fQ.-Z7HmKaVDlOvkzgycrL10b9dZCr7RFd3OiZj6giCrxk',
      'Content-Type', 'application/json'
    ),
    body:=concat('{"timestamp": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);