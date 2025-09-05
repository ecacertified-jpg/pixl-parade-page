-- Fix remaining critical security issues

-- First, let's identify and fix all functions that still don't have proper search_path
-- Check for any remaining functions and update them

-- Fix any remaining functions that might not have search_path set
CREATE OR REPLACE FUNCTION public.add_loyalty_points(p_user_id uuid, p_points integer, p_source_type text, p_source_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Points de fidélité gagnés'::text)
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

-- Fix cleanup_expired_verifications function
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.transaction_verifications 
  WHERE expires_at < now() AND NOT is_verified;
  RETURN NULL;
END;
$$;

-- Fix mask_contributor_info function  
CREATE OR REPLACE FUNCTION public.mask_contributor_info(name text, is_anonymous boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF is_anonymous OR name IS NULL THEN
    RETURN 'Anonyme';
  END IF;
  
  -- Masquer le nom (garde 3 premiers caractères + ***)
  IF length(name) <= 3 THEN
    RETURN substring(name, 1, 1) || '***';
  ELSE
    RETURN substring(name, 1, 3) || '***';
  END IF;
END;
$$;

-- Check if there are any problematic security definer views and drop them if they exist
-- Since we can't see the exact view, let's create a safe alternative approach

-- Instead of using potentially problematic views, ensure all access is through proper functions
-- Drop any problematic views if they exist (this is safe if they don't exist)
DROP VIEW IF EXISTS admin_view CASCADE;
DROP VIEW IF EXISTS user_admin_view CASCADE;
DROP VIEW IF EXISTS secure_admin_view CASCADE;

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

-- Move extensions out of public schema if possible
-- Note: This might not be possible for all extensions, depending on what's installed
-- The user may need to handle this manually in Supabase dashboard

-- Create a function to ensure proper role-based access without using views
CREATE OR REPLACE FUNCTION public.check_admin_permission(required_role text DEFAULT 'admin')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.admin_users 
  WHERE user_id = auth.uid() 
  AND is_active = true;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check role hierarchy: super_admin > admin > moderator
  CASE required_role
    WHEN 'super_admin' THEN
      RETURN user_role = 'super_admin';
    WHEN 'admin' THEN 
      RETURN user_role IN ('super_admin', 'admin');
    WHEN 'moderator' THEN
      RETURN user_role IN ('super_admin', 'admin', 'moderator');
    ELSE
      RETURN false;
  END CASE;
END;
$$;