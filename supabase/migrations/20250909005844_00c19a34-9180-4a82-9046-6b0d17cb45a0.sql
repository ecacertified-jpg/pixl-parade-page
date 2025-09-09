-- Phase 1: Supprimer le trigger erroné sur collective_funds
-- Ce trigger cause l'erreur "record 'new' has no field 'fund_id'"
DROP TRIGGER IF EXISTS trigger_contribution_activity ON public.collective_funds;

-- Phase 2: Vérifier et supprimer tous les triggers incorrects sur collective_funds
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.collective_funds;
DROP TRIGGER IF EXISTS contribution_activity_trigger ON public.collective_funds;

-- Phase 3: S'assurer que les triggers contribution sont SEULEMENT sur fund_contributions
-- Supprimer d'abord tous les anciens triggers sur fund_contributions
DROP TRIGGER IF EXISTS trigger_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS contribution_activity_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.fund_contributions;

-- Recréer uniquement le bon trigger sur fund_contributions
CREATE TRIGGER trigger_handle_contribution_activity
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.handle_contribution_activity();

-- Phase 4: Vérifier que tous les autres triggers sont correctement placés
-- Update fund amount trigger (doit être sur fund_contributions)
DROP TRIGGER IF EXISTS trigger_update_fund_current_amount ON public.fund_contributions;
CREATE TRIGGER trigger_update_fund_current_amount
AFTER INSERT OR UPDATE OR DELETE ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_fund_current_amount();

-- Award points trigger (doit être sur fund_contributions)
DROP TRIGGER IF EXISTS trigger_award_points_contribution ON public.fund_contributions;
CREATE TRIGGER trigger_award_points_contribution
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.award_points_contribution();