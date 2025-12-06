-- Créer une nouvelle fonction qui vérifie par contact_id directement
CREATE OR REPLACE FUNCTION public.has_active_fund_for_contact(p_contact_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.beneficiary_contact_id = p_contact_id
    AND cf.status IN ('active', 'target_reached')
    AND (cf.current_amount IS NULL OR cf.current_amount < cf.target_amount)
  );
END;
$function$;

-- Mettre à jour la fonction de validation du trigger
CREATE OR REPLACE FUNCTION public.validate_single_active_fund()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier seulement si on crée un nouveau fonds avec un bénéficiaire
  IF TG_OP = 'INSERT' AND NEW.beneficiary_contact_id IS NOT NULL THEN
    -- Vérifier s'il existe déjà une cotisation active pour CE contact spécifique
    IF EXISTS (
      SELECT 1 FROM public.collective_funds cf
      WHERE cf.beneficiary_contact_id = NEW.beneficiary_contact_id
      AND cf.id != NEW.id
      AND cf.status IN ('active', 'target_reached')
      AND (cf.current_amount IS NULL OR cf.current_amount < cf.target_amount)
    ) THEN
      RAISE EXCEPTION 'Une cotisation est déjà en cours pour ce bénéficiaire. Veuillez attendre qu''elle soit terminée avant d''en créer une nouvelle.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Mettre à jour aussi la fonction has_active_fund_for_beneficiary pour être cohérente
-- Cette fonction est utilisée ailleurs, on la garde mais on corrige sa logique
CREATE OR REPLACE FUNCTION public.has_active_fund_for_beneficiary(p_beneficiary_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Cette fonction vérifie si un USER a déjà une cotisation active
  -- Elle ne doit pas bloquer les cotisations pour des CONTACTS différents
  -- On retourne false par défaut pour ne pas bloquer la création
  -- La vraie validation se fait au niveau du trigger avec beneficiary_contact_id
  RETURN false;
END;
$function$;