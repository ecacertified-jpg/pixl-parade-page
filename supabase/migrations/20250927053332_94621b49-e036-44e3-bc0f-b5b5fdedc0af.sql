-- Ajouter une contrainte pour empêcher qu'un utilisateur crée une cagnotte où il serait le bénéficiaire
-- via les contacts (vérifier que le contact ne lui appartient pas)

-- Fonction pour vérifier si l'utilisateur tente de créer une cagnotte pour lui-même
CREATE OR REPLACE FUNCTION public.prevent_self_beneficiary_fund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_user_id UUID;
BEGIN
  -- Si pas de beneficiary_contact_id, on laisse passer
  IF NEW.beneficiary_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'user_id du contact bénéficiaire
  SELECT user_id INTO contact_user_id
  FROM public.contacts
  WHERE id = NEW.beneficiary_contact_id;

  -- Empêcher la création si le contact appartient au créateur
  -- (ce qui signifierait qu'il crée une cagnotte pour un de ses propres contacts, potentiellement lui-même)
  IF contact_user_id = NEW.creator_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas créer une cagnotte pour un contact qui vous appartient. Les cagnottes sont destinées à offrir des cadeaux à autrui.';
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur collective_funds
DROP TRIGGER IF EXISTS prevent_self_beneficiary_trigger ON public.collective_funds;
CREATE TRIGGER prevent_self_beneficiary_trigger
  BEFORE INSERT OR UPDATE ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_beneficiary_fund();

-- Mettre à jour quelques cagnottes pour les rendre publiques (pour les tests)
-- Utiliser un subquery au lieu de LIMIT dans UPDATE
UPDATE public.collective_funds 
SET is_public = true 
WHERE id IN (
  SELECT id 
  FROM public.collective_funds 
  WHERE status = 'active' 
  AND created_at > (NOW() - INTERVAL '30 days')
  AND is_public IS NOT TRUE
  ORDER BY created_at DESC
  FETCH FIRST 3 ROWS ONLY
);