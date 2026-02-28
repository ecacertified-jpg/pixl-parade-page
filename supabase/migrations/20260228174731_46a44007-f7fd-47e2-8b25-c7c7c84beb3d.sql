
-- Update notify_on_target_reached to also call notify-fund-ready Edge Function for business vendor notification
CREATE OR REPLACE FUNCTION notify_on_target_reached()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_record RECORD;
  request_id bigint;
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

    -- Call notify-fund-ready Edge Function to alert the business vendor via WhatsApp
    BEGIN
      SELECT net.http_post(
        url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-fund-ready',
        body := jsonb_build_object('fund_id', NEW.id),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Source', 'db-trigger'
        )
      ) INTO request_id;
      RAISE LOG 'notify-fund-ready HTTP request queued via pg_net: %', request_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error calling notify-fund-ready via pg_net: %', SQLERRM;
    END;

  END IF;

  RETURN NEW;
END;
$$;
