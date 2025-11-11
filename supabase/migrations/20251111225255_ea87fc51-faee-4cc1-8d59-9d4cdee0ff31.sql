-- Add post_notifications column to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS post_notifications BOOLEAN DEFAULT true;

-- Update existing rows to have post_notifications enabled by default
UPDATE public.notification_preferences 
SET post_notifications = true 
WHERE post_notifications IS NULL;