-- Add new specific interval columns to contact_alert_preferences
ALTER TABLE public.contact_alert_preferences
ADD COLUMN IF NOT EXISTS alert_10_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_5_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_3_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_2_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_1_day boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_day_of boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_of_adder_birthday boolean DEFAULT true;

-- Drop obsolete columns (J-30, J-14, daily from J-10)
ALTER TABLE public.contact_alert_preferences
DROP COLUMN IF EXISTS alert_30_days,
DROP COLUMN IF EXISTS alert_14_days,
DROP COLUMN IF EXISTS alert_10_days_daily;

-- Add comment for documentation
COMMENT ON COLUMN public.contact_alert_preferences.alert_10_days IS 'Reminder 10 days before birthday';
COMMENT ON COLUMN public.contact_alert_preferences.alert_5_days IS 'Reminder 5 days before birthday';
COMMENT ON COLUMN public.contact_alert_preferences.alert_3_days IS 'Reminder 3 days before birthday';
COMMENT ON COLUMN public.contact_alert_preferences.alert_2_days IS 'Reminder 2 days before birthday';
COMMENT ON COLUMN public.contact_alert_preferences.alert_1_day IS 'Reminder 1 day before birthday';
COMMENT ON COLUMN public.contact_alert_preferences.alert_day_of IS 'Reminder on birthday day';
COMMENT ON COLUMN public.contact_alert_preferences.notify_of_adder_birthday IS 'Receive notifications about birthday of user who added you';