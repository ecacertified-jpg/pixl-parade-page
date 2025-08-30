-- Recréer les triggers manquants sur fund_contributions
-- Vérifier d'abord que les triggers n'existent pas déjà
DROP TRIGGER IF EXISTS update_fund_current_amount_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS award_points_contribution_trigger ON public.fund_contributions;

-- Recréer les triggers nécessaires
CREATE TRIGGER update_fund_current_amount_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fund_current_amount();

CREATE TRIGGER handle_contribution_activity_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contribution_activity();

CREATE TRIGGER award_points_contribution_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_contribution();