-- Add country_code to admin_notifications
ALTER TABLE admin_notifications 
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Index for filtered queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_country 
ON admin_notifications(country_code);

-- Add monitored_countries to admin_notification_preferences
ALTER TABLE admin_notification_preferences 
ADD COLUMN IF NOT EXISTS monitored_countries TEXT[] DEFAULT ARRAY['CI', 'SN', 'BJ'];

-- Comment for documentation
COMMENT ON COLUMN admin_notifications.country_code IS 'Country code (CI, SN, BJ) for geographic filtering';
COMMENT ON COLUMN admin_notification_preferences.monitored_countries IS 'Array of country codes to monitor. NULL or empty means all countries';