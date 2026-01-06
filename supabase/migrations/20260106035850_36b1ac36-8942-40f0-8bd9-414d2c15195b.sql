-- Table de suivi des relances envoyées
CREATE TABLE public.profile_completion_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_number integer NOT NULL DEFAULT 1,
  completion_at_send integer NOT NULL DEFAULT 0,
  missing_fields text[] DEFAULT '{}',
  channel text NOT NULL DEFAULT 'email',
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  completed_after boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table de configuration des relances
CREATE TABLE public.profile_reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  reminder_1_days integer DEFAULT 3,
  reminder_2_days integer DEFAULT 7,
  reminder_3_days integer DEFAULT 14,
  reminder_final_days integer DEFAULT 30,
  min_completion_threshold integer DEFAULT 80,
  max_reminders integer DEFAULT 4,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  email_subject_1 text DEFAULT 'Complétez votre profil pour recevoir plus de cadeaux! 🎁',
  email_subject_2 text DEFAULT 'Vos amis veulent vous offrir des cadeaux! 💝',
  email_subject_3 text DEFAULT 'Ne manquez pas les anniversaires de vos proches 🎂',
  email_subject_final text DEFAULT 'Dernière chance de compléter votre profil ⏰',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes pour les requêtes de relance
CREATE INDEX idx_profile_reminders_user ON profile_completion_reminders(user_id);
CREATE INDEX idx_profile_reminders_sent_at ON profile_completion_reminders(sent_at);
CREATE UNIQUE INDEX idx_profile_reminders_unique ON profile_completion_reminders(user_id, reminder_number);

-- RLS pour profile_completion_reminders
ALTER TABLE profile_completion_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reminders"
ON profile_completion_reminders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "System can insert reminders"
ON profile_completion_reminders FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update reminders"
ON profile_completion_reminders FOR UPDATE
USING (true);

-- RLS pour profile_reminder_settings
ALTER TABLE profile_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminder settings"
ON profile_reminder_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Anyone can read reminder settings"
ON profile_reminder_settings FOR SELECT
USING (true);

-- Insérer la configuration par défaut
INSERT INTO profile_reminder_settings (id) VALUES (gen_random_uuid());

-- Trigger pour updated_at
CREATE TRIGGER update_profile_reminder_settings_updated_at
BEFORE UPDATE ON profile_reminder_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();