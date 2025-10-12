-- Create trigger to notify on new contribution
CREATE OR REPLACE FUNCTION notify_on_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_record RECORD;
  creator_name TEXT;
  contributor_name TEXT;
BEGIN
  -- Get fund details
  SELECT cf.*, p.first_name, p.last_name 
  INTO fund_record
  FROM collective_funds cf
  LEFT JOIN profiles p ON p.user_id = cf.creator_id
  WHERE cf.id = NEW.fund_id;

  -- Get contributor name
  SELECT COALESCE(first_name || ' ' || last_name, 'Un ami') INTO contributor_name
  FROM profiles WHERE user_id = NEW.contributor_id;

  -- Notify fund creator (unless they are the contributor)
  IF fund_record.creator_id != NEW.contributor_id THEN
    INSERT INTO scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      fund_record.creator_id,
      'new_contribution',
      '🎉 Nouvelle contribution!',
      contributor_name || ' a contribué ' || NEW.amount || ' ' || NEW.currency || ' à "' || fund_record.title || '"',
      now(),
      ARRAY['push', 'in_app'],
      jsonb_build_object(
        'fund_id', NEW.fund_id,
        'contribution_id', NEW.id,
        'contributor_id', NEW.contributor_id,
        'amount', NEW.amount
      )
    );
  END IF;

  -- Notify all other contributors about the new contribution (domino effect)
  INSERT INTO scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  )
  SELECT DISTINCT
    fc.contributor_id,
    'fund_progress',
    '📈 Progrès de la cotisation',
    contributor_name || ' vient de contribuer à "' || fund_record.title || '". Plus que ' || 
    (fund_record.target_amount - fund_record.current_amount - NEW.amount) || ' ' || NEW.currency || ' !',
    now(),
    ARRAY['in_app'],
    jsonb_build_object(
      'fund_id', NEW.fund_id,
      'new_contributor_id', NEW.contributor_id,
      'progress_percentage', ROUND(((fund_record.current_amount + NEW.amount)::numeric / fund_record.target_amount::numeric) * 100, 2)
    )
  FROM fund_contributions fc
  WHERE fc.fund_id = NEW.fund_id
    AND fc.contributor_id != NEW.contributor_id
    AND fc.contributor_id != fund_record.creator_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_notify_on_contribution ON fund_contributions;
CREATE TRIGGER trigger_notify_on_contribution
  AFTER INSERT ON fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_contribution();

-- Create trigger to notify when target is reached
CREATE OR REPLACE FUNCTION notify_on_target_reached()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_record RECORD;
BEGIN
  -- Only proceed if target just reached
  IF OLD.current_amount < OLD.target_amount AND NEW.current_amount >= NEW.target_amount THEN
    
    -- Get fund details
    SELECT * INTO fund_record FROM collective_funds WHERE id = NEW.id;

    -- Notify fund creator
    INSERT INTO scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      NEW.creator_id,
      'fund_target_reached',
      '🎉 Objectif atteint!',
      'Félicitations! La cotisation "' || NEW.title || '" a atteint son objectif de ' || 
      NEW.target_amount || ' ' || NEW.currency || '!',
      now(),
      ARRAY['push', 'in_app', 'email'],
      jsonb_build_object(
        'fund_id', NEW.id,
        'target_amount', NEW.target_amount,
        'current_amount', NEW.current_amount
      )
    );

    -- Notify all contributors
    INSERT INTO scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    )
    SELECT DISTINCT
      fc.contributor_id,
      'fund_target_reached',
      '🎊 Objectif atteint ensemble!',
      'La cotisation "' || NEW.title || '" a atteint son objectif grâce à votre contribution!',
      now(),
      ARRAY['push', 'in_app'],
      jsonb_build_object(
        'fund_id', NEW.id,
        'target_amount', NEW.target_amount
      )
    FROM fund_contributions fc
    WHERE fc.fund_id = NEW.id
      AND fc.contributor_id != NEW.creator_id
    ON CONFLICT DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_notify_on_target_reached ON collective_funds;
CREATE TRIGGER trigger_notify_on_target_reached
  AFTER UPDATE OF current_amount ON collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_target_reached();

-- Enable realtime for scheduled_notifications if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_notifications;
