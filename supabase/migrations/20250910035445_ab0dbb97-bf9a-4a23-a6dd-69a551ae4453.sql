-- Function to calculate deadline (1 day before birthday)
CREATE OR REPLACE FUNCTION calculate_fund_deadline(contact_birthday date, created_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Calculate birthday for the current year or next year if already passed
  IF (DATE(created_year || '-' || EXTRACT(MONTH FROM contact_birthday) || '-' || EXTRACT(DAY FROM contact_birthday)) <= CURRENT_DATE) THEN
    -- Birthday this year has passed, use next year
    RETURN DATE((created_year + 1) || '-' || EXTRACT(MONTH FROM contact_birthday) || '-' || EXTRACT(DAY FROM contact_birthday)) - INTERVAL '1 day';
  ELSE
    -- Birthday this year hasn't passed yet
    RETURN DATE(created_year || '-' || EXTRACT(MONTH FROM contact_birthday) || '-' || EXTRACT(DAY FROM contact_birthday)) - INTERVAL '1 day';
  END IF;
END;
$$;

-- Update collective_funds to auto-calculate deadline when inserting
CREATE OR REPLACE FUNCTION set_fund_deadline()
RETURNS TRIGGER AS $$
DECLARE
  contact_birthday date;
BEGIN
  -- Get contact's birthday
  SELECT birthday INTO contact_birthday
  FROM public.contacts
  WHERE id = NEW.beneficiary_contact_id;
  
  -- Set deadline if we have a birthday and no deadline is set
  IF contact_birthday IS NOT NULL AND NEW.deadline_date IS NULL THEN
    NEW.deadline_date := calculate_fund_deadline(contact_birthday);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic deadline setting
DROP TRIGGER IF EXISTS trigger_set_fund_deadline ON public.collective_funds;
CREATE TRIGGER trigger_set_fund_deadline
  BEFORE INSERT ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION set_fund_deadline();

-- Function to schedule warning notifications (2 weeks before deadline)
CREATE OR REPLACE FUNCTION schedule_fund_warnings()
RETURNS TRIGGER AS $$
DECLARE
  warning_date timestamp with time zone;
  final_warning_date timestamp with time zone;
BEGIN
  IF NEW.deadline_date IS NOT NULL THEN
    -- Schedule warning 2 weeks before deadline
    warning_date := (NEW.deadline_date - INTERVAL '14 days')::timestamp with time zone;
    -- Schedule final warning 3 days before deadline  
    final_warning_date := (NEW.deadline_date - INTERVAL '3 days')::timestamp with time zone;
    
    -- Only schedule if warning date is in the future
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
        ROUND((NEW.current_amount::numeric / NEW.target_amount::numeric) * 100, 0) || '% atteint.',
        warning_date,
        ARRAY['email', 'push', 'in_app'],
        jsonb_build_object(
          'fund_id', NEW.id,
          'warning_type', 'two_weeks',
          'deadline_date', NEW.deadline_date
        )
      FROM public.fund_contributions fc
      WHERE fc.fund_id = NEW.id;
    END IF;
    
    -- Schedule final warning
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
      WHERE fc.fund_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduling warnings when contributions are made
DROP TRIGGER IF EXISTS trigger_schedule_fund_warnings ON public.fund_contributions;
CREATE TRIGGER trigger_schedule_fund_warnings
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION schedule_fund_warnings();

-- Function to send refund request to JOIE DE VIVRE service
CREATE OR REPLACE FUNCTION request_refund_from_service(
  p_fund_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'XOF'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  refund_request_id uuid;
  user_name text;
  fund_title text;
BEGIN
  -- Generate refund request ID
  refund_request_id := gen_random_uuid();
  
  -- Get user name and fund title
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Utilisateur') INTO user_name
  FROM public.profiles p WHERE p.user_id = p_user_id;
  
  SELECT title INTO fund_title
  FROM public.collective_funds WHERE id = p_fund_id;
  
  -- Create notification for JOIE DE VIVRE service (admin notification)
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
    au.user_id,
    'refund_request',
    'Demande de remboursement',
    'Remboursement demandé pour ' || user_name || ' - Montant: ' || p_amount || ' ' || p_currency || 
    ' - Cotisation: "' || fund_title || '"',
    now(),
    ARRAY['email', 'in_app'],
    jsonb_build_object(
      'refund_request_id', refund_request_id,
      'fund_id', p_fund_id,
      'user_id', p_user_id,
      'amount', p_amount,
      'currency', p_currency,
      'user_name', user_name,
      'fund_title', fund_title
    )
  FROM public.admin_users au
  WHERE au.is_active = true;
  
  RETURN refund_request_id;
END;
$$;