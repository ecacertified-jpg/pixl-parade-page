
-- 1. Update CHECK constraint to allow new alert types
ALTER TABLE birthday_contact_alerts 
  DROP CONSTRAINT birthday_contact_alerts_alert_type_check;

ALTER TABLE birthday_contact_alerts 
  ADD CONSTRAINT birthday_contact_alerts_alert_type_check 
  CHECK (alert_type = ANY (ARRAY[
    'immediate', 'month', 'two_weeks', 'daily',
    'contact_added', 'friends_circle_welcome', 'friends_circle_reminder'
  ]));

-- 2. Make contact_id nullable for user-level alerts
ALTER TABLE birthday_contact_alerts 
  ALTER COLUMN contact_id DROP NOT NULL;
