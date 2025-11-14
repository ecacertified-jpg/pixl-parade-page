-- Add missing columns to notifications table for action_url and metadata
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on action_url for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_action_url ON public.notifications(action_url) WHERE action_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional contextual data for the notification';