-- Fix the validate_sensitive_inputs function to not reference non-existent email field
CREATE OR REPLACE FUNCTION public.validate_sensitive_inputs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate phone numbers (basic format check)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\+]?[0-9\s\-\(\)]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Remove email validation since profiles table doesn't have email column
  -- Email validation should be handled by auth.users table instead
  
  RETURN NEW;
END;
$$;