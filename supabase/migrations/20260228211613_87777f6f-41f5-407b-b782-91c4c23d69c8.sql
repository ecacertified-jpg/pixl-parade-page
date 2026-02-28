
-- Trigger function to call notify-contribution-progress Edge Function via pg_net
CREATE OR REPLACE FUNCTION notify_contribution_progress_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  BEGIN
    SELECT net.http_post(
      url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-contribution-progress',
      body := jsonb_build_object(
        'fund_id', NEW.fund_id,
        'contributor_id', NEW.contributor_id
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Source', 'db-trigger'
      )
    ) INTO request_id;
    RAISE LOG 'notify-contribution-progress HTTP request queued via pg_net: %', request_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error calling notify-contribution-progress via pg_net: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger on fund_contributions
CREATE TRIGGER on_fund_contribution_notify_progress
AFTER INSERT ON fund_contributions
FOR EACH ROW
EXECUTE FUNCTION notify_contribution_progress_trigger();
