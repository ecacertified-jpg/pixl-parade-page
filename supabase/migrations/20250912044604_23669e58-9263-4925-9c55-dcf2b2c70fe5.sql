-- Fix schedule_fund_warnings trigger issue
-- Drop the incorrect trigger from fund_contributions if it exists
DROP TRIGGER IF EXISTS trigger_schedule_fund_warnings ON public.fund_contributions;

-- Recreate the schedule_fund_warnings function with proper error handling
CREATE OR REPLACE FUNCTION public.schedule_fund_warnings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  warning_date timestamp with time zone;
  final_warning_date timestamp with time zone;
BEGIN
  -- Only proceed if we have a deadline_date (this function should only be called on collective_funds)
  IF NEW.deadline_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate warning dates
  warning_date := (NEW.deadline_date - INTERVAL '14 days')::timestamp with time zone;
  final_warning_date := (NEW.deadline_date - INTERVAL '3 days')::timestamp with time zone;
  
  -- Clean up old notifications if deadline changed
  IF TG_OP = 'UPDATE' AND OLD.deadline_date IS DISTINCT FROM NEW.deadline_date THEN
    DELETE FROM public.scheduled_notifications 
    WHERE notification_type IN ('fund_deadline_warning', 'fund_deadline_final_warning')
    AND (metadata->>'fund_id')::uuid = NEW.id;
  END IF;
  
  -- Schedule 2-week warning if in the future
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
  
  -- Schedule final warning if in the future
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

-- Create the trigger correctly on collective_funds for deadline_date changes
DROP TRIGGER IF EXISTS trigger_schedule_fund_warnings ON public.collective_funds;
CREATE TRIGGER trigger_schedule_fund_warnings
  AFTER INSERT OR UPDATE OF deadline_date ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_fund_warnings();