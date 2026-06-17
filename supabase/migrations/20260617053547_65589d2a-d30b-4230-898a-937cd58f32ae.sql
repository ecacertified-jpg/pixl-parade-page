-- Emotional automation engine: campaigns orchestrator + on-this-day dedup table

CREATE TABLE public.emotional_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  template_key text,
  cooldown_hours integer NOT NULL DEFAULT 24,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_run_stats jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotional_campaigns TO authenticated;
GRANT ALL ON public.emotional_campaigns TO service_role;

ALTER TABLE public.emotional_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage emotional campaigns"
ON public.emotional_campaigns FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

CREATE OR REPLACE FUNCTION public.touch_emotional_campaigns()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER emotional_campaigns_touch BEFORE UPDATE ON public.emotional_campaigns
FOR EACH ROW EXECUTE FUNCTION public.touch_emotional_campaigns();

-- On-this-day delivery log (anti-spam)
CREATE TABLE public.on_this_day_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memory_date date NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_date, source_type, source_id)
);

GRANT SELECT ON public.on_this_day_log TO authenticated;
GRANT ALL ON public.on_this_day_log TO service_role;

ALTER TABLE public.on_this_day_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own on-this-day log"
ON public.on_this_day_log FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_on_this_day_user_date ON public.on_this_day_log(user_id, memory_date);

-- Seed default emotional campaigns
INSERT INTO public.emotional_campaigns (key, name, description, trigger_type, channel, cooldown_hours, payload) VALUES
('on_this_day', 'Souvenirs du jour', 'Photos/vidéos de la même date les années précédentes', 'daily_cron', 'in_app', 24, '{"min_years_ago": 1}'::jsonb),
('birthday_countdown', 'Compte à rebours anniversaire', 'Rappels J-7 à J-1 avant anniversaire ami', 'event_based', 'whatsapp', 24, '{}'::jsonb),
('inactive_reengagement', 'Réengagement inactifs', 'Relance utilisateurs sans activité > 14 jours', 'daily_cron', 'whatsapp', 168, '{"inactive_days": 14}'::jsonb),
('event_countdown', 'Compte à rebours événement', 'Rappels avant événement (mariage, baptême)', 'event_based', 'in_app', 24, '{}'::jsonb),
('gratitude_nudge', 'Nudge gratitude', 'Suggérer de remercier après réception cadeau', 'event_based', 'in_app', 72, '{}'::jsonb);
