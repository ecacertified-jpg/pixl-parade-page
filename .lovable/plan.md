

## Plan: Add CRON job for `birthday-reminder-with-suggestions`

### Problem
The Edge Function `birthday-reminder-with-suggestions` exists but has no CRON job to trigger it. Only `check-birthday-alerts-for-contacts` is scheduled (at 00:30 UTC). The `birthday-reminder-with-suggestions` function — which handles the `joiedevivre_birthday_friend_alert` template and fund-linked alerts — is never called automatically.

### Solution
Create a new pg_cron job to invoke `birthday-reminder-with-suggestions` daily. Schedule it at **01:00 UTC** (after the contacts check at 00:30).

### Implementation
Run this SQL via the SQL Editor (not a migration, since it contains project-specific keys):

```sql
SELECT cron.schedule(
  'birthday-reminder-with-suggestions-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-reminder-with-suggestions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
    body := concat('{"timestamp": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
```

### Files to modify
- None. This is a SQL-only change to run in the Supabase SQL Editor.

