-- Nettoyage complet de tous les triggers sur fund_contributions
-- Supprimer TOUS les triggers existants (avec différents noms possibles)
DROP TRIGGER IF EXISTS award_points_contribution ON public.fund_contributions;
DROP TRIGGER IF EXISTS award_points_contribution_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS update_fund_current_amount ON public.fund_contributions;
DROP TRIGGER IF EXISTS update_fund_current_amount_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_update_fund_amount ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_award_points_contribution ON public.fund_contributions;
DROP TRIGGER IF EXISTS fund_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS contribution_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS fund_update_trigger ON public.fund_contributions;

-- Recréer les triggers dans l'ordre correct (UN SEUL de chaque)
-- 1. Mettre à jour le montant du fonds
CREATE TRIGGER update_fund_current_amount_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fund_current_amount();

-- 2. Créer l'activité de contribution
CREATE TRIGGER handle_contribution_activity_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contribution_activity();

-- 3. Attribuer les points de fidélité
CREATE TRIGGER award_points_contribution_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_contribution();