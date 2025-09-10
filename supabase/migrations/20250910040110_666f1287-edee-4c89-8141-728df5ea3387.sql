-- Fix security warnings by setting search_path on functions
ALTER FUNCTION calculate_fund_deadline(date, integer) SET search_path = 'public';
ALTER FUNCTION set_fund_deadline() SET search_path = 'public';  
ALTER FUNCTION schedule_fund_warnings() SET search_path = 'public';

-- Create cron job to process expired funds daily at 6 AM
SELECT cron.schedule(
  'process-expired-funds-daily',
  '0 6 * * *', -- Every day at 6 AM
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/process-expired-funds',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);