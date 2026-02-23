
-- Add new interval columns
ALTER TABLE public.contact_alert_preferences
  ADD COLUMN IF NOT EXISTS alert_30_days boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_21_days boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_14_days boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_7_days boolean NOT NULL DEFAULT true;

-- Drop old columns
ALTER TABLE public.contact_alert_preferences
  DROP COLUMN IF EXISTS alert_10_days,
  DROP COLUMN IF EXISTS alert_day_of;
