-- Modifier la fonction pour permettre la création de cagnottes pour les contacts de l'utilisateur
-- mais empêcher qu'il crée une cagnotte pour lui-même (basé sur l'email)
CREATE OR REPLACE FUNCTION public.prevent_self_beneficiary_fund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contact_email TEXT;
  creator_email TEXT;
BEGIN
  -- Si pas de beneficiary_contact_id, on laisse passer
  IF NEW.beneficiary_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'email du contact bénéficiaire
  SELECT email INTO contact_email
  FROM public.contacts
  WHERE id = NEW.beneficiary_contact_id;

  -- Récupérer l'email du créateur depuis auth.users
  SELECT email INTO creator_email
  FROM auth.users
  WHERE id = NEW.creator_id;

  -- Empêcher la création si les emails correspondent (l'utilisateur crée une cagnotte pour lui-même)
  IF contact_email IS NOT NULL AND creator_email IS NOT NULL AND 
     LOWER(contact_email) = LOWER(creator_email) THEN
    RAISE EXCEPTION 'Vous ne pouvez pas créer une cagnotte pour vous-même.';
  END IF;

  RETURN NEW;
END;
$function$;