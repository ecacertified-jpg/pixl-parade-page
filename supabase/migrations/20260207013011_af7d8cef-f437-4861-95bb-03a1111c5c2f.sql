
-- Régénérer les rappels pour la cagnotte Samsung Galaxy A16 avec le bon ID
DO $$
DECLARE
  v_fund RECORD;
  friend_rec RECORD;
  reminder_num integer;
  days_until_deadline integer;
  current_reminder_date date;
  friends_found integer := 0;
BEGIN
  SELECT * INTO v_fund FROM public.collective_funds 
  WHERE id = 'c73a3ef7-5bba-46a0-9009-215f69f8474f';
  
  IF v_fund IS NULL THEN
    RAISE NOTICE 'Fund not found!';
    RETURN;
  END IF;
  
  IF v_fund.deadline_date IS NULL THEN
    RAISE NOTICE 'No deadline set';
    RETURN;
  END IF;
  
  days_until_deadline := (v_fund.deadline_date::date - CURRENT_DATE);
  RAISE NOTICE 'Fund: %, Days until deadline: %', v_fund.title, days_until_deadline;
  
  IF days_until_deadline < 2 THEN
    RAISE NOTICE 'Less than 2 days, skipping';
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
    friends_found := friends_found + 1;
    RAISE NOTICE 'Friend found: %, phone: %', friend_rec.user_id, friend_rec.phone;
    
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
  
  RAISE NOTICE 'Total friends found: %', friends_found;
END$$;
