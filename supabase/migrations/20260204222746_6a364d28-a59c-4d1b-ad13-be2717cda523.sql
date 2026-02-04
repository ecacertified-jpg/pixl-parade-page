-- Create function to auto-create default contact alert preferences
CREATE OR REPLACE FUNCTION create_default_contact_alert_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contact_alert_preferences (
    user_id,
    alerts_enabled,
    sms_enabled,
    whatsapp_enabled,
    email_enabled,
    alert_on_contact_add,
    alert_10_days,
    alert_5_days,
    alert_3_days,
    alert_2_days,
    alert_1_day,
    alert_day_of,
    notify_of_adder_birthday
  ) VALUES (
    NEW.user_id,
    true, true, true, false,
    true, true, true, true, true, true, true, true
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_create_alert_prefs ON profiles;
CREATE TRIGGER on_profile_created_create_alert_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_contact_alert_preferences();

-- Backfill: Create preferences for existing users who don't have them
INSERT INTO contact_alert_preferences (
  user_id, alerts_enabled, sms_enabled, whatsapp_enabled, email_enabled,
  alert_on_contact_add, alert_10_days, alert_5_days, alert_3_days,
  alert_2_days, alert_1_day, alert_day_of, notify_of_adder_birthday
)
SELECT 
  user_id, true, true, true, false,
  true, true, true, true, true, true, true, true
FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM contact_alert_preferences)
ON CONFLICT (user_id) DO NOTHING;