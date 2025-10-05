-- Améliorer can_contribute_to_fund pour permettre aux amis du bénéficiaire de contribuer
CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  fund_creator_id uuid;
  fund_status text;
  beneficiary_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Récupérer les infos de la cagnotte et du bénéficiaire
  SELECT cf.creator_id, cf.status, c.user_id
  INTO fund_creator_id, fund_status, beneficiary_user_id
  FROM public.collective_funds cf
  LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
  WHERE cf.id = fund_uuid;
  
  IF fund_creator_id IS NULL THEN
    RETURN false;
  END IF;
  
  IF fund_status != 'active' THEN
    RETURN false;
  END IF;
  
  -- Le créateur peut toujours contribuer à son propre fonds
  IF fund_creator_id = current_user_id THEN
    RETURN true;
  END IF;
  
  -- Les amis du créateur avec permission peuvent contribuer
  IF EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE ((user_a = current_user_id AND user_b = fund_creator_id) OR
           (user_a = fund_creator_id AND user_b = current_user_id))
    AND can_see_funds = true
  ) THEN
    RETURN true;
  END IF;
  
  -- NOUVEAU : Les amis du bénéficiaire peuvent contribuer
  IF beneficiary_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE (user_a = current_user_id AND user_b = beneficiary_user_id)
       OR (user_b = current_user_id AND user_a = beneficiary_user_id)
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;