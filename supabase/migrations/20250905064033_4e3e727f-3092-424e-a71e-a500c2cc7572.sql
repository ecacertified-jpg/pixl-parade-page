-- Fix remaining functions without proper search_path
-- Check all functions in public schema and update them

-- Update all remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id uuid, 
  p_points integer, 
  p_source_type text, 
  p_source_id uuid DEFAULT NULL::uuid, 
  p_description text DEFAULT 'Points de fidélité gagnés'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer := 0;
  new_balance integer;
BEGIN
  -- Vérifier que les points sont positifs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Le nombre de points doit être positif';
  END IF;

  -- Créer ou récupérer le compte de fidélité
  INSERT INTO public.loyalty_points (user_id, current_points, total_earned)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_points = loyalty_points.current_points + p_points,
    total_earned = loyalty_points.total_earned + p_points,
    updated_at = now()
  RETURNING current_points INTO new_balance;

  -- Enregistrer la transaction
  INSERT INTO public.loyalty_transactions (
    user_id,
    transaction_type,
    points_amount,
    points_balance_after,
    source_type,
    source_id,
    description
  ) VALUES (
    p_user_id,
    'earned',
    p_points,
    new_balance,
    p_source_type,
    p_source_id,
    p_description
  );
END;
$$;

-- Fix other critical functions
CREATE OR REPLACE FUNCTION public.spend_loyalty_points(
  p_user_id uuid, 
  p_points integer, 
  p_source_type text, 
  p_source_id uuid DEFAULT NULL::uuid, 
  p_description text DEFAULT 'Points de fidélité dépensés'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  -- Vérifier que les points sont positifs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Le nombre de points doit être positif';
  END IF;

  -- Récupérer le solde actuel
  SELECT current_points INTO current_balance
  FROM public.loyalty_points
  WHERE user_id = p_user_id;

  -- Vérifier si l'utilisateur a suffisamment de points
  IF current_balance IS NULL OR current_balance < p_points THEN
    RETURN false;
  END IF;

  -- Déduire les points
  UPDATE public.loyalty_points
  SET 
    current_points = current_points - p_points,
    total_spent = total_spent + p_points,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING current_points INTO new_balance;

  -- Enregistrer la transaction
  INSERT INTO public.loyalty_transactions (
    user_id,
    transaction_type,
    points_amount,
    points_balance_after,
    source_type,
    source_id,
    description
  ) VALUES (
    p_user_id,
    'spent',
    -p_points,
    new_balance,
    p_source_type,
    p_source_id,
    p_description
  );

  RETURN true;
END;
$$;

-- Fix calculate_loyalty_points function
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(p_activity_type text, p_amount numeric DEFAULT 0)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE p_activity_type
    WHEN 'fund_creation' THEN
      RETURN 50; -- 50 points pour créer une cagnotte
    WHEN 'fund_contribution' THEN
      -- 1 point par 1000 XOF contribué, minimum 10 points
      RETURN GREATEST(10, FLOOR(p_amount / 1000)::integer);
    WHEN 'purchase' THEN
      -- 1 point par 500 XOF d'achat
      RETURN FLOOR(p_amount / 500)::integer;
    WHEN 'referral' THEN
      RETURN 100; -- 100 points pour un parrainage
    WHEN 'birthday_gift' THEN
      RETURN 25; -- 25 points pour un cadeau d'anniversaire
    WHEN 'workshop_completion' THEN
      RETURN 75; -- 75 points pour terminer un atelier
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

-- Remove any potentially problematic extensions from public schema
-- Check for extensions that might be in public schema and move them
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- Get list of extensions in public schema
    FOR ext_record IN 
        SELECT extname 
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public'
        AND extname NOT IN ('uuid-ossp', 'pgcrypto') -- Keep commonly needed ones
    LOOP
        -- Try to move extension to extensions schema (if it exists)
        BEGIN
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
        EXCEPTION
            WHEN invalid_schema_name THEN
                -- Extensions schema doesn't exist, skip
                NULL;
            WHEN OTHERS THEN
                -- Log and continue
                RAISE NOTICE 'Could not move extension %: %', ext_record.extname, SQLERRM;
        END;
    END LOOP;
END;
$$;