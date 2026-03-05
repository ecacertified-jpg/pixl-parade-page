
-- Table pour tracker les notifications d'inactivité
CREATE TABLE public.inactive_user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  days_inactive integer NOT NULL,
  notification_type text NOT NULL DEFAULT 'push',
  message_variant text
);

-- Index pour lookup rapide par user + date
CREATE INDEX idx_inactive_notif_user ON public.inactive_user_notifications(user_id, sent_at DESC);

-- RLS
ALTER TABLE public.inactive_user_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all
CREATE POLICY "Admins can view all inactive notifications"
ON public.inactive_user_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Users can see their own
CREATE POLICY "Users can view own inactive notifications"
ON public.inactive_user_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Service role insert (edge function)
CREATE POLICY "Service role can insert"
ON public.inactive_user_notifications FOR INSERT
WITH CHECK (true);
