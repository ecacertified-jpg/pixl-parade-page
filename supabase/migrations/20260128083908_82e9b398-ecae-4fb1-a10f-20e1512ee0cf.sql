-- Table des préférences d'alertes pour les contacts
CREATE TABLE public.contact_alert_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  alerts_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT true,
  whatsapp_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  alert_on_contact_add boolean NOT NULL DEFAULT true,
  alert_30_days boolean NOT NULL DEFAULT true,
  alert_14_days boolean NOT NULL DEFAULT true,
  alert_10_days_daily boolean NOT NULL DEFAULT true,
  custom_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own contact alert preferences"
ON public.contact_alert_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own contact alert preferences"
ON public.contact_alert_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own contact alert preferences"
ON public.contact_alert_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_contact_alert_preferences_updated_at
BEFORE UPDATE ON public.contact_alert_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_contact_alert_preferences_user_id ON public.contact_alert_preferences(user_id);