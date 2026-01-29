-- ============================================
-- SEO Sync CRON Jobs Configuration
-- ============================================

-- Job 1: Process SEO sync queue every 15 minutes
SELECT cron.schedule(
  'process-seo-sync-queue',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := '{"action": "process_queue"}'::jsonb
  ) as request_id;
  $$
);

-- Job 2: Ping sitemaps daily at 6:00 UTC
SELECT cron.schedule(
  'ping-sitemaps-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := '{"action": "ping_sitemaps"}'::jsonb
  ) as request_id;
  $$
);

-- Job 3: Refresh AI catalog every 2 hours
SELECT cron.schedule(
  'refresh-ai-catalog',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := '{"action": "refresh_ai_catalog"}'::jsonb
  ) as request_id;
  $$
);