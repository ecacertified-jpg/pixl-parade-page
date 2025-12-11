-- Fix contribution_validation: Add database constraints for defense in depth
ALTER TABLE fund_contributions
DROP CONSTRAINT IF EXISTS amount_positive,
DROP CONSTRAINT IF EXISTS amount_max,
DROP CONSTRAINT IF EXISTS message_length;

ALTER TABLE fund_contributions
ADD CONSTRAINT amount_positive CHECK (amount > 0),
ADD CONSTRAINT amount_max CHECK (amount <= 500000),
ADD CONSTRAINT message_length CHECK (message IS NULL OR char_length(message) <= 500);

-- Create trigger to prevent fund overfunding
CREATE OR REPLACE FUNCTION public.check_contribution_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_amount numeric;
  v_current_amount numeric;
  v_fund_status text;
BEGIN
  -- Get fund details
  SELECT target_amount, current_amount, status 
  INTO v_target_amount, v_current_amount, v_fund_status
  FROM collective_funds 
  WHERE id = NEW.fund_id;
  
  -- Check fund status
  IF v_fund_status = 'expired' THEN
    RAISE EXCEPTION 'Cannot contribute to expired fund';
  END IF;
  
  IF v_fund_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot contribute to completed fund';
  END IF;
  
  -- Check for overfunding
  IF v_current_amount + NEW.amount > v_target_amount THEN
    RAISE EXCEPTION 'Contribution would exceed fund target (max: %)', v_target_amount - v_current_amount;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_contribution_limits ON fund_contributions;

-- Create trigger
CREATE TRIGGER enforce_contribution_limits
  BEFORE INSERT ON fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION check_contribution_limits();

-- Add comment for documentation
COMMENT ON FUNCTION public.check_contribution_limits() IS 'Server-side validation for fund contributions - prevents overfunding and contributions to expired/completed funds';