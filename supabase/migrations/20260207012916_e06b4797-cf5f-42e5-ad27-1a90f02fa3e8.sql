
-- =============================================
-- ÉTAPE 1 : Backfill des profils manquants
-- =============================================
INSERT INTO public.profiles (user_id, first_name, last_name, phone, country_code)
SELECT 
  u.id,
  u.raw_user_meta_data ->> 'first_name',
  u.raw_user_meta_data ->> 'last_name',
  COALESCE(u.raw_user_meta_data ->> 'phone', u.phone),
  CASE
    WHEN COALESCE(u.raw_user_meta_data ->> 'phone', u.phone) LIKE '+229%' THEN 'BJ'
    WHEN COALESCE(u.raw_user_meta_data ->> 'phone', u.phone) LIKE '+221%' THEN 'SN'
    WHEN COALESCE(u.raw_user_meta_data ->> 'phone', u.phone) LIKE '+225%' THEN 'CI'
    ELSE 'CI'
  END
FROM auth.users u
WHERE u.id NOT IN (SELECT p.user_id FROM public.profiles p WHERE p.user_id IS NOT NULL);

-- =============================================
-- ÉTAPE 2 : Régénérer les rappels pour la cagnotte existante
-- (Samsung Galaxy A16 - c73a3ef7...)
-- =============================================
DO $$
DECLARE
  v_fund RECORD;
  friend_rec RECORD;
  reminder_num integer;
  days_until_deadline integer;
  current_reminder_date date;
BEGIN
  -- Récupérer la cagnotte
  SELECT * INTO v_fund FROM public.collective_funds 
  WHERE id = 'c73a3ef7-79e2-4e73-a14c-a6e8aaf6b0a4';
  
  IF v_fund IS NULL OR v_fund.deadline_date IS NULL THEN
    RAISE NOTICE 'Fund not found or no deadline';
    RETURN;
  END IF;
  
  days_until_deadline := (v_fund.deadline_date::date - CURRENT_DATE);
  
  IF days_until_deadline < 2 THEN
    RAISE NOTICE 'Less than 2 days until deadline, skipping';
    RETURN;
  END IF;
  
  FOR friend_rec IN
    SELECT DISTINCT sub.friend_id as user_id, COALESCE(p.phone, '') as phone
    FROM (
      SELECT cr.user_b AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_a = v_fund.creator_id
        AND cr.can_see_funds = true
        AND cr.user_b != v_fund.creator_id
      UNION
      SELECT cr.user_a AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_b = v_fund.creator_id
        AND cr.can_see_funds = true
        AND cr.user_a != v_fund.creator_id
    ) sub
    JOIN profiles p ON p.user_id = sub.friend_id
  LOOP
    reminder_num := 1;
    current_reminder_date := CURRENT_DATE;
    
    WHILE current_reminder_date < v_fund.deadline_date::date LOOP
      INSERT INTO fund_contribution_reminders (
        fund_id, target_user_id, target_phone,
        reminder_date, reminder_number, status
      ) VALUES (
        v_fund.id, friend_rec.user_id, friend_rec.phone,
        current_reminder_date, reminder_num, 'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
      
      reminder_num := reminder_num + 1;
      current_reminder_date := current_reminder_date + INTERVAL '2 days';
    END LOOP;
    
    -- Rappel J-1
    IF (v_fund.deadline_date::date - INTERVAL '1 day')::date > CURRENT_DATE THEN
      INSERT INTO fund_contribution_reminders (
        fund_id, target_user_id, target_phone,
        reminder_date, reminder_number, status
      ) VALUES (
        v_fund.id, friend_rec.user_id, friend_rec.phone,
        (v_fund.deadline_date::date - INTERVAL '1 day')::date, -1, 'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
    END IF;
  END LOOP;
END$$;

-- =============================================
-- ÉTAPE 3 : Renforcer handle_new_user() avec ON CONFLICT DO NOTHING
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
BEGIN
  phone_number := COALESCE(
    NEW.raw_user_meta_data ->> 'phone',
    NEW.phone
  );
  
  detected_country := CASE
    WHEN phone_number LIKE '+229%' THEN 'BJ'
    WHEN phone_number LIKE '+221%' THEN 'SN'
    WHEN phone_number LIKE '+225%' THEN 'CI'
    ELSE 'CI'
  END;
  
  INSERT INTO public.profiles (user_id, first_name, last_name, birthday, city, phone, country_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthday')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'city',
    phone_number,
    detected_country
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_reciprocity_preferences (
    user_id, alert_threshold, reminder_frequency,
    enable_suggestions, enable_notifications, private_mode
  )
  VALUES (NEW.id, 2.0, 'monthly', true, true, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- =============================================
-- ÉTAPE 4 : Améliorer le trigger de génération de rappels
-- pour ne plus exiger un téléphone (créer les rappels même sans phone)
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_fund_contribution_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_record RECORD;
  reminder_num integer;
  days_until_deadline integer;
  current_reminder_date date;
BEGIN
  IF NEW.deadline_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  days_until_deadline := (NEW.deadline_date::date - CURRENT_DATE);
  
  IF days_until_deadline < 2 THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les amis même sans téléphone (le CRON skippera si invalid_phone)
  FOR friend_record IN
    SELECT DISTINCT sub.friend_id as user_id, COALESCE(p.phone, '') as phone
    FROM (
      SELECT cr.user_b AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_a = NEW.creator_id
        AND cr.can_see_funds = true
        AND cr.user_b != NEW.creator_id
      UNION
      SELECT cr.user_a AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_b = NEW.creator_id
        AND cr.can_see_funds = true
        AND cr.user_a != NEW.creator_id
    ) sub
    JOIN profiles p ON p.user_id = sub.friend_id
  LOOP
    reminder_num := 1;
    current_reminder_date := CURRENT_DATE;
    
    WHILE current_reminder_date < NEW.deadline_date::date LOOP
      INSERT INTO fund_contribution_reminders (
        fund_id, target_user_id, target_phone,
        reminder_date, reminder_number, status
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
    
    IF (NEW.deadline_date::date - INTERVAL '1 day')::date > CURRENT_DATE THEN
      INSERT INTO fund_contribution_reminders (
        fund_id, target_user_id, target_phone,
        reminder_date, reminder_number, status
      ) VALUES (
        NEW.id,
        friend_record.user_id,
        friend_record.phone,
        (NEW.deadline_date::date - INTERVAL '1 day')::date,
        -1,
        'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;
