CREATE OR REPLACE FUNCTION public.validate_sensitive_inputs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate phone numbers (basic format check)
  -- Ignore NULL and empty strings
  IF NEW.phone IS NOT NULL 
     AND NEW.phone != '' 
     AND NEW.phone !~ '^[\+]?[0-9\s\-\(\)]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$function$;