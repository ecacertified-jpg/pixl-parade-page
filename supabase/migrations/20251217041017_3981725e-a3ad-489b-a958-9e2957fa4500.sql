-- Add birthday_reminder_days column to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS birthday_reminder_days integer[] DEFAULT '{14, 7, 3, 1}'::integer[];

-- Update existing rows to have default value
UPDATE public.notification_preferences 
SET birthday_reminder_days = '{14, 7, 3, 1}'::integer[]
WHERE birthday_reminder_days IS NULL;