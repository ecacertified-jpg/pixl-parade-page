-- Phase 1: Supprimer spécifiquement le trigger erroné qui cause l'erreur
-- L'erreur "record 'new' has no field 'fund_id'" indique qu'il y a un trigger mal placé

-- Supprimer tous les triggers avec "contribution_activity" ou similaire qui pourraient être sur collective_funds
DROP TRIGGER IF EXISTS trigger_contribution_activity ON public.collective_funds;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.collective_funds;
DROP TRIGGER IF EXISTS contribution_activity_trigger ON public.collective_funds;

-- Supprimer également tout trigger mal nommé sur fund_contributions qui pourrait causer des conflits
DROP TRIGGER IF EXISTS contribution_activity_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS trigger_contribution_activity ON public.fund_contributions;

-- Phase 2: Recréer SEULEMENT le trigger manquant s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_handle_contribution_activity' 
        AND event_object_table = 'fund_contributions'
    ) THEN
        CREATE TRIGGER trigger_handle_contribution_activity
        AFTER INSERT ON public.fund_contributions
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_contribution_activity();
    END IF;
END $$;