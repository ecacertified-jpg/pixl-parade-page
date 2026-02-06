-- ============================================
-- Table: fund_contribution_reminders
-- Stocke les rappels SMS planifiés pour les contributeurs potentiels
-- ============================================

CREATE TABLE public.fund_contribution_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id uuid NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL,
  target_phone text NOT NULL,
  reminder_date date NOT NULL,
  reminder_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'cancelled')),
  skip_reason text CHECK (skip_reason IN ('contributed', 'goal_reached', 'fund_closed', 'invalid_phone', 'sms_failed', NULL)),
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour les requêtes CRON quotidiennes
CREATE INDEX idx_fund_reminders_date_status ON public.fund_contribution_reminders(reminder_date, status) WHERE status = 'pending';

-- Index pour éviter les doublons
CREATE UNIQUE INDEX idx_fund_reminders_unique ON public.fund_contribution_reminders(fund_id, target_user_id, reminder_date);

-- Index pour les lookups par fund
CREATE INDEX idx_fund_reminders_fund ON public.fund_contribution_reminders(fund_id);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.fund_contribution_reminders ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres rappels
CREATE POLICY "Users can view their own reminders"
ON public.fund_contribution_reminders
FOR SELECT
USING (auth.uid() = target_user_id);

-- Seul le service role peut insérer/modifier (via trigger et CRON)
-- Pas de policy INSERT/UPDATE/DELETE pour les utilisateurs normaux

-- ============================================
-- Fonction pour générer les rappels
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_fund_contribution_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_record RECORD;
  reminder_date date;
  reminder_num integer;
  days_until_deadline integer;
  current_reminder_date date;
BEGIN
  -- Seulement pour les cagnottes avec une deadline
  IF NEW.deadline_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculer le nombre de jours jusqu'à la deadline
  days_until_deadline := (NEW.deadline_date::date - CURRENT_DATE);
  
  -- Si moins de 2 jours, pas de rappels
  IF days_until_deadline < 2 THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les amis du créateur qui peuvent voir les cagnottes
  FOR friend_record IN
    SELECT DISTINCT 
      cr.friend_id as user_id,
      p.phone
    FROM contact_relationships cr
    JOIN profiles p ON p.user_id = cr.friend_id
    WHERE cr.user_id = NEW.creator_id
      AND cr.can_see_funds = true
      AND p.phone IS NOT NULL
      AND p.phone != ''
      AND cr.friend_id != NEW.creator_id
  LOOP
    -- Générer les dates de rappel (tous les 2 jours)
    reminder_num := 1;
    current_reminder_date := CURRENT_DATE;
    
    WHILE current_reminder_date < NEW.deadline_date::date LOOP
      -- Insérer le rappel
      INSERT INTO fund_contribution_reminders (
        fund_id,
        target_user_id,
        target_phone,
        reminder_date,
        reminder_number,
        status
      ) VALUES (
        NEW.id,
        friend_record.user_id,
        friend_record.phone,
        current_reminder_date,
        reminder_num,
        'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
      
      reminder_num := reminder_num + 1;
      current_reminder_date := current_reminder_date + INTERVAL '2 days';
    END LOOP;
    
    -- Ajouter le rappel J-1 (dernier jour)
    IF (NEW.deadline_date::date - INTERVAL '1 day')::date > CURRENT_DATE THEN
      INSERT INTO fund_contribution_reminders (
        fund_id,
        target_user_id,
        target_phone,
        reminder_date,
        reminder_number,
        status
      ) VALUES (
        NEW.id,
        friend_record.user_id,
        friend_record.phone,
        (NEW.deadline_date::date - INTERVAL '1 day')::date,
        -1, -- -1 indique le dernier rappel
        'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Trigger sur création de cagnotte
-- ============================================

CREATE TRIGGER trigger_generate_fund_reminders
AFTER INSERT ON public.collective_funds
FOR EACH ROW
EXECUTE FUNCTION public.generate_fund_contribution_reminders();

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON TABLE public.fund_contribution_reminders IS 'Rappels SMS planifiés pour inciter les amis à contribuer aux cagnottes';
COMMENT ON COLUMN public.fund_contribution_reminders.reminder_number IS 'Numéro du rappel (1, 2, 3...), -1 pour le dernier rappel (J-1)';
COMMENT ON COLUMN public.fund_contribution_reminders.skip_reason IS 'Raison si le rappel a été ignoré';