CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'fund_contributions' THEN
    IF (to_jsonb(NEW) ->> 'contributor_id') IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;