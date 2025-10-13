-- Phase 2: Notifications complètes - Archivage et Préférences

-- 1. Ajouter colonnes d'archivage aux notifications existantes
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.scheduled_notifications 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_archived ON public.notifications(user_id, is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_archived ON public.scheduled_notifications(user_id, is_archived) WHERE is_archived = false;

-- 2. Table des préférences de notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  
  -- Canaux activés
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true,
  
  -- Par catégorie
  birthday_notifications boolean DEFAULT true,
  event_notifications boolean DEFAULT true,
  contribution_notifications boolean DEFAULT true,
  gift_notifications boolean DEFAULT true,
  fund_deadline_notifications boolean DEFAULT true,
  ai_suggestions boolean DEFAULT true,
  
  -- Fréquence
  digest_mode boolean DEFAULT false,
  digest_frequency text DEFAULT 'daily', -- daily, weekly
  quiet_hours_start time,
  quiet_hours_end time,
  
  -- Autres
  sound_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS pour notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Table des souscriptions push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  
  -- Subscription data
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  
  -- Device info
  device_type text, -- web, android, ios
  device_name text,
  user_agent text,
  
  -- Status
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, endpoint)
);

-- RLS pour push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Fonction pour auto-archiver les anciennes notifications (30 jours)
CREATE OR REPLACE FUNCTION public.archive_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archiver les notifications lues de plus de 30 jours
  UPDATE public.notifications
  SET is_archived = true, archived_at = now()
  WHERE is_read = true 
  AND created_at < now() - interval '30 days'
  AND is_archived = false;
  
  -- Archiver les notifications planifiées expirées
  UPDATE public.scheduled_notifications
  SET is_archived = true, archived_at = now()
  WHERE scheduled_for < now() - interval '30 days'
  AND is_archived = false;
END;
$$;

-- 5. Fonction pour créer des préférences par défaut pour nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement les préférences
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();