-- Table pour suivre les alertes d'anniversaire envoyées aux contacts
CREATE TABLE public.birthday_contact_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('immediate', 'month', 'two_weeks', 'daily')),
  days_before INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  opted_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour éviter les doublons (un seul envoi par type/jour/contact)
CREATE UNIQUE INDEX idx_birthday_alerts_unique 
ON public.birthday_contact_alerts(user_id, contact_id, alert_type, days_before)
WHERE status = 'sent';

-- Index pour les requêtes du cron job
CREATE INDEX idx_birthday_alerts_status ON public.birthday_contact_alerts(status, created_at);
CREATE INDEX idx_birthday_alerts_user ON public.birthday_contact_alerts(user_id);
CREATE INDEX idx_birthday_alerts_contact ON public.birthday_contact_alerts(contact_id);

-- Enable RLS
ALTER TABLE public.birthday_contact_alerts ENABLE ROW LEVEL SECURITY;

-- Politique RLS: les utilisateurs ne peuvent voir que leurs propres alertes
CREATE POLICY "Users can view own birthday alerts"
ON public.birthday_contact_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own birthday alerts"
ON public.birthday_contact_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own birthday alerts"
ON public.birthday_contact_alerts FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_birthday_contact_alerts_updated_at
BEFORE UPDATE ON public.birthday_contact_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE public.birthday_contact_alerts IS 'Suivi des notifications SMS/WhatsApp envoyées aux contacts pour les anniversaires';
COMMENT ON COLUMN public.birthday_contact_alerts.alert_type IS 'Type: immediate (à l''ajout), month (J-30), two_weeks (J-14), daily (J-10 à J-1)';
COMMENT ON COLUMN public.birthday_contact_alerts.days_before IS 'Nombre de jours avant l''anniversaire (0 = jour J)';