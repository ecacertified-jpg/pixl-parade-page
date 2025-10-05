-- Recreate the can_contribute_to_fund function with public fund support
CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_user_id uuid;
  fund_creator_id uuid;
  fund_status text;
  fund_is_public boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Log pour débogage
  RAISE LOG 'can_contribute_to_fund called: fund_uuid=%, user_id=%', fund_uuid, current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE LOG 'can_contribute_to_fund: User not logged in';
    RETURN false;
  END IF;
  
  -- Vérifier si la cotisation existe et récupérer ses informations
  SELECT creator_id, status, is_public 
  INTO fund_creator_id, fund_status, fund_is_public
  FROM public.collective_funds 
  WHERE id = fund_uuid;
  
  IF fund_creator_id IS NULL THEN
    RAISE LOG 'can_contribute_to_fund: Fund not found';
    RETURN false;
  END IF;
  
  IF fund_status != 'active' THEN
    RAISE LOG 'can_contribute_to_fund: Fund not active, status=%', fund_status;
    RETURN false;
  END IF;
  
  -- Le créateur peut toujours contribuer à son propre fonds
  IF fund_creator_id = current_user_id THEN
    RAISE LOG 'can_contribute_to_fund: Creator can contribute to own fund';
    RETURN true;
  END IF;
  
  -- Si le fonds est public, tout utilisateur authentifié peut contribuer
  IF fund_is_public = true THEN
    RAISE LOG 'can_contribute_to_fund: Public fund, anyone can contribute';
    RETURN true;
  END IF;
  
  -- Vérifier l'amitié avec permission de voir les cotisations
  IF EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE ((user_a = current_user_id AND user_b = fund_creator_id) OR
           (user_a = fund_creator_id AND user_b = current_user_id))
    AND can_see_funds = true
  ) THEN
    RAISE LOG 'can_contribute_to_fund: Friend with permissions can contribute';
    RETURN true;
  END IF;
  
  RAISE LOG 'can_contribute_to_fund: No permission to contribute';
  RETURN false;
END;
$function$;