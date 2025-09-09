-- Phase 1: Clean up duplicate triggers on fund_contributions table
-- Remove all duplicate triggers, keeping only the standardized ones

-- Drop all existing triggers to start clean
DROP TRIGGER IF EXISTS award_points_contribution_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.fund_contributions;  
DROP TRIGGER IF EXISTS update_fund_current_amount_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_award_points_contribution ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_handle_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_update_fund_current_amount ON public.fund_contributions;

-- Phase 2: Recreate triggers in the correct order with proper naming
-- 1. First: Update fund current amount (most critical)
CREATE TRIGGER trigger_update_fund_current_amount
AFTER INSERT OR UPDATE OR DELETE ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_fund_current_amount();

-- 2. Second: Handle contribution activity logging  
CREATE TRIGGER trigger_handle_contribution_activity
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.handle_contribution_activity();

-- 3. Third: Award loyalty points
CREATE TRIGGER trigger_award_points_contribution
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.award_points_contribution();

-- Phase 3: Ensure fund completion trigger is on the right table
DROP TRIGGER IF EXISTS trigger_handle_fund_completion ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_handle_fund_completion ON public.collective_funds;

CREATE TRIGGER trigger_handle_fund_completion
AFTER UPDATE ON public.collective_funds
FOR EACH ROW
WHEN (OLD.current_amount < OLD.target_amount AND NEW.current_amount >= NEW.target_amount)
EXECUTE FUNCTION public.handle_fund_completion();