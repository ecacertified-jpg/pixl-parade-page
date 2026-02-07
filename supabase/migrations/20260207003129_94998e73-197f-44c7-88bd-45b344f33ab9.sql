
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
  
  -- Récupérer les amis du créateur dans les DEUX directions de contact_relationships
  FOR friend_record IN
    SELECT DISTINCT sub.friend_id as user_id, p.phone
    FROM (
      -- Cas 1 : creator est user_a → ami est user_b
      SELECT cr.user_b AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_a = NEW.creator_id
        AND cr.can_see_funds = true
        AND cr.user_b != NEW.creator_id
      UNION
      -- Cas 2 : creator est user_b → ami est user_a
      SELECT cr.user_a AS friend_id
      FROM contact_relationships cr
      WHERE cr.user_b = NEW.creator_id
        AND cr.can_see_funds = true
        AND cr.user_a != NEW.creator_id
    ) sub
    JOIN profiles p ON p.user_id = sub.friend_id
    WHERE p.phone IS NOT NULL
      AND p.phone != ''
  LOOP
    -- Générer les dates de rappel (tous les 2 jours)
    reminder_num := 1;
    current_reminder_date := CURRENT_DATE;
    
    WHILE current_reminder_date < NEW.deadline_date::date LOOP
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
        -1,
        'pending'
      )
      ON CONFLICT (fund_id, target_user_id, reminder_date) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;
