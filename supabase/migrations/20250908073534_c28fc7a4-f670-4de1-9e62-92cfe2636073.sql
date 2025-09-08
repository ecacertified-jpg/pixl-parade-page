-- Phase 1: Fix the misconfigured trigger
-- Drop the incorrect trigger on fund_contributions
DROP TRIGGER IF EXISTS trigger_handle_fund_completion ON public.fund_contributions;

-- Recreate the trigger on the correct table (collective_funds) for UPDATE events
CREATE TRIGGER trigger_handle_fund_completion
AFTER UPDATE ON public.collective_funds
FOR EACH ROW
EXECUTE FUNCTION public.handle_fund_completion();

-- Also ensure the contribution activity trigger exists and is correct
DROP TRIGGER IF EXISTS trigger_handle_contribution_activity ON public.fund_contributions;
CREATE TRIGGER trigger_handle_contribution_activity
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.handle_contribution_activity();

-- Ensure the fund amount update trigger exists and is correct
DROP TRIGGER IF EXISTS trigger_update_fund_current_amount ON public.fund_contributions;
CREATE TRIGGER trigger_update_fund_current_amount
AFTER INSERT OR UPDATE OR DELETE ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_fund_current_amount();

-- Ensure proper trigger ordering
DROP TRIGGER IF EXISTS trigger_award_points_contribution ON public.fund_contributions;
CREATE TRIGGER trigger_award_points_contribution
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.award_points_contribution();