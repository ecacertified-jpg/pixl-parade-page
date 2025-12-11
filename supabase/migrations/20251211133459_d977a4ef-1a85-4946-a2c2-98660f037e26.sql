-- Fix business_inputs_validation: Add server-side validation for business accounts
-- This provides defense-in-depth against client-side validation bypass

CREATE OR REPLACE FUNCTION public.validate_business_account_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate business_name (required, min 2, max 100 chars)
  IF NEW.business_name IS NULL OR length(trim(NEW.business_name)) < 2 THEN
    RAISE EXCEPTION 'Business name must be at least 2 characters';
  END IF;
  
  IF length(NEW.business_name) > 100 THEN
    RAISE EXCEPTION 'Business name must be less than 100 characters';
  END IF;
  
  -- Sanitize business_name - remove HTML tags
  NEW.business_name := regexp_replace(NEW.business_name, '<[^>]*>', '', 'g');
  
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    IF length(NEW.email) > 255 THEN
      RAISE EXCEPTION 'Email must be less than 255 characters';
    END IF;
  END IF;
  
  -- Validate phone format if provided (flexible format for Ivory Coast numbers)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF NEW.phone !~ '^\+?[0-9\s\-\(\)]{8,20}$' THEN
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;
  
  -- Sanitize and limit description
  IF NEW.description IS NOT NULL THEN
    -- Remove HTML tags
    NEW.description := regexp_replace(NEW.description, '<[^>]*>', '', 'g');
    -- Limit length
    IF length(NEW.description) > 2000 THEN
      RAISE EXCEPTION 'Description must be less than 2000 characters';
    END IF;
  END IF;
  
  -- Sanitize and limit address
  IF NEW.address IS NOT NULL THEN
    NEW.address := regexp_replace(NEW.address, '<[^>]*>', '', 'g');
    IF length(NEW.address) > 500 THEN
      RAISE EXCEPTION 'Address must be less than 500 characters';
    END IF;
  END IF;
  
  -- Validate website_url format if provided
  IF NEW.website_url IS NOT NULL AND NEW.website_url != '' THEN
    IF NEW.website_url !~ '^https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}.*$' THEN
      RAISE EXCEPTION 'Invalid website URL format (must start with http:// or https://)';
    END IF;
    IF length(NEW.website_url) > 500 THEN
      RAISE EXCEPTION 'Website URL must be less than 500 characters';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS validate_business_account ON business_accounts;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER validate_business_account
  BEFORE INSERT OR UPDATE ON business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_account_insert();

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_business_account_insert() IS 'Server-side validation for business accounts - validates and sanitizes business_name, email, phone, description, address, website_url';