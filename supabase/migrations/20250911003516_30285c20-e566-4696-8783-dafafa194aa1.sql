-- Migration pour corriger le trigger schedule_fund_warnings mal attaché

-- 1. Supprimer le trigger mal attaché à fund_contributions
DROP TRIGGER IF EXISTS schedule_fund_warnings_trigger ON public.fund_contributions;

-- 2. Vérifier si le trigger existe déjà sur collective_funds et le supprimer si nécessaire
DROP TRIGGER IF EXISTS schedule_fund_warnings_trigger ON public.collective_funds;

-- 3. Créer le trigger correctement sur collective_funds lors de l'insertion/mise à jour
CREATE TRIGGER schedule_fund_warnings_trigger
  AFTER INSERT OR UPDATE OF deadline_date ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_fund_warnings();

-- 4. Améliorer la fonction pour éviter les erreurs sur les fonds sans deadline
CREATE OR REPLACE FUNCTION public.schedule_fund_warnings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  warning_date timestamp with time zone;
  final_warning_date timestamp with time zone;
BEGIN
  -- Vérifier que deadline_date existe et n'est pas null
  IF NEW.deadline_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculer les dates d'avertissement
  warning_date := (NEW.deadline_date - INTERVAL '14 days')::timestamp with time zone;
  final_warning_date := (NEW.deadline_date - INTERVAL '3 days')::timestamp with time zone;
  
  -- Supprimer les anciennes notifications si on met à jour la deadline
  IF TG_OP = 'UPDATE' AND OLD.deadline_date IS DISTINCT FROM NEW.deadline_date THEN
    DELETE FROM public.scheduled_notifications 
    WHERE notification_type IN ('fund_deadline_warning', 'fund_deadline_final_warning')
    AND (metadata->>'fund_id')::uuid = NEW.id;
  END IF;
  
  -- Programmer l'avertissement 2 semaines avant si dans le futur
  IF warning_date > now() THEN
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    )
    SELECT 
      fc.contributor_id,
      'fund_deadline_warning',
      'Attention: Cotisation bientôt expirée ⚠️',
      'La cotisation "' || NEW.title || '" expire dans 2 semaines. Objectif: ' || 
      COALESCE(ROUND((COALESCE(NEW.current_amount, 0)::numeric / NEW.target_amount::numeric) * 100, 0), 0) || '% atteint.',
      warning_date,
      ARRAY['email', 'push', 'in_app'],
      jsonb_build_object(
        'fund_id', NEW.id,
        'warning_type', 'two_weeks',
        'deadline_date', NEW.deadline_date
      )
    FROM public.fund_contributions fc
    WHERE fc.fund_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Programmer l'avertissement final si dans le futur
  IF final_warning_date > now() THEN
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    )
    SELECT 
      fc.contributor_id,
      'fund_deadline_final_warning',
      'URGENT: Cotisation expire dans 3 jours! 🚨',
      'Dernière chance pour la cotisation "' || NEW.title || '". Expiration: ' || 
      TO_CHAR(NEW.deadline_date, 'DD/MM/YYYY'),
      final_warning_date,
      ARRAY['email', 'push', 'in_app', 'sms'],
      jsonb_build_object(
        'fund_id', NEW.id,
        'warning_type', 'final',
        'deadline_date', NEW.deadline_date
      )
    FROM public.fund_contributions fc
    WHERE fc.fund_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;