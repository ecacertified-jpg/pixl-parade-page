-- Add security documentation for business_accounts.payment_info column
-- This addresses the PUBLIC_DATA_EXPOSURE and OTHER security findings about payment information storage

COMMENT ON COLUMN public.business_accounts.payment_info IS 
'SECURITY: Store ONLY tokenized payment references, never actual credentials.
Acceptable: {"stripeCustomerId": "cus_xxx", "mobileMoney": "**** 1234"}
PROHIBITED: Raw card numbers, bank account credentials, API keys, passwords.
This field is protected by RLS (auth.uid() = user_id) but should never contain sensitive credentials.
Use payment processor tokens (Stripe, etc.) for all payment operations.';

-- Add validation function to ensure payment_info doesn't contain sensitive patterns
CREATE OR REPLACE FUNCTION public.validate_payment_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block if payment_info contains suspicious patterns that might indicate raw credentials
  IF NEW.payment_info::text ~* '(card|cvv|password|secret|key|pin)[\s]*[:=]' THEN
    RAISE EXCEPTION 'Payment info cannot contain raw credentials. Use tokenized references only.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to business_accounts
DROP TRIGGER IF EXISTS validate_business_payment_info ON public.business_accounts;
CREATE TRIGGER validate_business_payment_info
  BEFORE INSERT OR UPDATE ON public.business_accounts
  FOR EACH ROW
  WHEN (NEW.payment_info IS NOT NULL)
  EXECUTE FUNCTION public.validate_payment_info();

COMMENT ON FUNCTION public.validate_payment_info() IS 
'Security validation: Prevents storing raw payment credentials in payment_info JSONB fields.
Blocks patterns like "card:", "cvv:", "password:", etc. to enforce tokenized data storage.';