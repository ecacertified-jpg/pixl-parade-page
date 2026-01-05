-- Create notification_analytics table for tracking push notification performance
CREATE TABLE public.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  notification_id UUID,
  user_id UUID,
  
  -- Type et contenu
  notification_type TEXT NOT NULL DEFAULT 'push',
  category TEXT,
  title TEXT,
  body TEXT,
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  action_url TEXT,
  conversion_type TEXT,
  conversion_value NUMERIC,
  device_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Index for performance queries
CREATE INDEX idx_notification_analytics_sent_at ON notification_analytics(sent_at DESC);
CREATE INDEX idx_notification_analytics_category ON notification_analytics(category);
CREATE INDEX idx_notification_analytics_status ON notification_analytics(status);
CREATE INDEX idx_notification_analytics_user_id ON notification_analytics(user_id);

-- RLS policies - only admins can view
CREATE POLICY "Admins can view notification analytics"
ON notification_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage notification analytics"
ON notification_analytics FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.notification_analytics IS 'Tracks push notification delivery, opens, clicks and conversions for analytics';