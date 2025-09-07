-- Améliorer la fonction can_contribute_to_fund pour permettre au créateur de contribuer
CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid;
  fund_creator_id uuid;
  fund_status text;
BEGIN
  current_user_id := auth.uid();
  
  -- Log pour débogage
  RAISE LOG 'can_contribute_to_fund called: fund_uuid=%, user_id=%', fund_uuid, current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE LOG 'can_contribute_to_fund: User not logged in';
    RETURN false;
  END IF;
  
  -- Vérifier si la cotisation existe et est active
  SELECT creator_id, status INTO fund_creator_id, fund_status
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

-- Créer quelques relations d'amitié de test pour permettre les contributions
-- Récupérer l'ID de l'utilisateur principal
DO $$
DECLARE
    main_user_id uuid;
    test_user_1 uuid;
    test_user_2 uuid;
BEGIN
    -- Récupérer l'utilisateur principal (celui qui a créé les fonds)
    SELECT creator_id INTO main_user_id
    FROM public.collective_funds 
    LIMIT 1;
    
    IF main_user_id IS NOT NULL THEN
        -- Créer deux utilisateurs test
        INSERT INTO auth.users (id, email, encrypted_password, role, created_at, updated_at, confirmation_token)
        VALUES 
        (gen_random_uuid(), 'test1@example.com', 'encrypted', 'authenticated', now(), now(), 'test1'),
        (gen_random_uuid(), 'test2@example.com', 'encrypted', 'authenticated', now(), now(), 'test2')
        ON CONFLICT (email) DO NOTHING;
        
        -- Récupérer les IDs des utilisateurs test
        SELECT id INTO test_user_1 FROM auth.users WHERE email = 'test1@example.com';
        SELECT id INTO test_user_2 FROM auth.users WHERE email = 'test2@example.com';
        
        -- Créer les profils pour les utilisateurs test
        INSERT INTO public.profiles (user_id, first_name, last_name)
        VALUES 
        (test_user_1, 'Test', 'User1'),
        (test_user_2, 'Test', 'User2')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Créer des relations d'amitié avec permissions
        INSERT INTO public.contact_relationships (user_a, user_b, relationship_type, can_see_funds)
        VALUES 
        (main_user_id, test_user_1, 'friend', true),
        (main_user_id, test_user_2, 'friend', true)
        ON CONFLICT (user_a, user_b) DO UPDATE SET can_see_funds = true;
        
        RAISE NOTICE 'Relations d''amitié créées pour l''utilisateur %', main_user_id;
    END IF;
END $$;