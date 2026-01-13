-- Create admin notification preferences table
CREATE TABLE public.admin_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL UNIQUE,
  
  -- Notification channels
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Alert types
  client_deletion_alerts BOOLEAN NOT NULL DEFAULT true,
  new_client_alerts BOOLEAN NOT NULL DEFAULT true,
  new_business_alerts BOOLEAN NOT NULL DEFAULT true,
  new_order_alerts BOOLEAN NOT NULL DEFAULT true,
  refund_request_alerts BOOLEAN NOT NULL DEFAULT true,
  critical_moderation_alerts BOOLEAN NOT NULL DEFAULT true,
  performance_alerts BOOLEAN NOT NULL DEFAULT true,
  growth_alerts BOOLEAN NOT NULL DEFAULT true,
  
  -- Digest mode
  daily_digest BOOLEAN NOT NULL DEFAULT false,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Foreign key
  CONSTRAINT fk_admin_notification_prefs_admin
    FOREIGN KEY (admin_user_id) 
    REFERENCES admin_users(user_id) 
    ON DELETE CASCADE
);

-- Index for fast lookup
CREATE INDEX idx_admin_notification_prefs_user 
  ON public.admin_notification_preferences(admin_user_id);

-- Enable RLS
ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own preferences
CREATE POLICY "Admins can view own notification preferences"
  ON public.admin_notification_preferences 
  FOR SELECT
  USING (admin_user_id = auth.uid());

-- Policy: Admins can insert their own preferences
CREATE POLICY "Admins can insert own notification preferences"
  ON public.admin_notification_preferences 
  FOR INSERT
  WITH CHECK (admin_user_id = auth.uid());

-- Policy: Admins can update their own preferences
CREATE POLICY "Admins can update own notification preferences"
  ON public.admin_notification_preferences 
  FOR UPDATE
  USING (admin_user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_admin_notification_prefs_updated_at
  BEFORE UPDATE ON public.admin_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.admin_notification_preferences IS 
  'Stores notification preferences for each admin user - channels, alert types, and quiet hours';