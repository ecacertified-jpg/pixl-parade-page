ALTER TABLE public.contact_alert_preferences
  ADD COLUMN IF NOT EXISTS alert_day_of boolean NOT NULL DEFAULT true;