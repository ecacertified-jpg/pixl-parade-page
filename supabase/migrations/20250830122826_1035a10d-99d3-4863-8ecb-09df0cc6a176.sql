-- Nettoyer et corriger le système de cotisations avec visibilité basée sur l'amitié

-- Supprimer TOUS les triggers et politiques existants d'abord
DROP TRIGGER IF EXISTS fund_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS award_points_contribution ON public.fund_contributions;
DROP TRIGGER IF EXISTS update_fund_current_amount ON public.fund_contributions;

-- Supprimer toutes les politiques RLS existantes pour collective_funds
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'collective_funds' 
        AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.collective_funds';
    END LOOP;
END $$;

-- Supprimer toutes les politiques RLS existantes pour fund_contributions
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'fund_contributions' 
        AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.fund_contributions';
    END LOOP;
END $$;

-- Ajouter la colonne can_see_funds si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contact_relationships' 
                   AND column_name = 'can_see_funds') THEN
        ALTER TABLE public.contact_relationships 
        ADD COLUMN can_see_funds boolean DEFAULT true;
    END IF;
END $$;

-- Mettre toutes les cotisations en mode privé
UPDATE public.collective_funds 
SET is_public = false;

-- Mettre à jour les relations existantes
UPDATE public.contact_relationships 
SET can_see_funds = COALESCE(can_see_funds, true);

-- Recréer les fonctions RLS améliorées
CREATE OR REPLACE FUNCTION public.user_can_see_fund(fund_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Permettre à l'utilisateur de voir ses propres cotisations
  IF EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid AND creator_id = user_uuid
  ) THEN
    RETURN true;
  END IF;

  -- Permettre de voir les cotisations des amis avec permission
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.contact_relationships cr ON 
      (cf.creator_id = cr.user_a AND cr.user_b = user_uuid) OR
      (cf.creator_id = cr.user_b AND cr.user_a = user_uuid)
    WHERE cf.id = fund_uuid 
    AND cr.can_see_funds = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  fund_creator_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si la cotisation existe et est active
  SELECT creator_id INTO fund_creator_id 
  FROM public.collective_funds 
  WHERE id = fund_uuid AND status = 'active';
  
  IF fund_creator_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Le créateur peut toujours contribuer
  IF fund_creator_id = current_user_id THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'amitié avec permission de voir les cotisations
  RETURN EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE ((user_a = current_user_id AND user_b = fund_creator_id) OR
           (user_a = fund_creator_id AND user_b = current_user_id))
    AND can_see_funds = true
  );
END;
$function$;

-- Recréer toutes les politiques RLS
CREATE POLICY "Users can view accessible funds"
  ON public.collective_funds
  FOR SELECT
  USING (public.user_can_see_fund(id, auth.uid()));

CREATE POLICY "Users can create funds"
  ON public.collective_funds
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own funds"
  ON public.collective_funds
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own funds"
  ON public.collective_funds
  FOR DELETE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can contribute to accessible funds"
  ON public.fund_contributions
  FOR INSERT
  WITH CHECK (public.can_contribute_to_fund(fund_id) AND auth.uid() = contributor_id);

CREATE POLICY "Users can view contributions to accessible funds"
  ON public.fund_contributions
  FOR SELECT
  USING (public.user_can_see_fund(fund_id, auth.uid()));

-- Recréer les triggers corrigés
CREATE OR REPLACE FUNCTION public.handle_contribution_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_info RECORD;
  contributor_name TEXT;
  remaining_amount NUMERIC;
BEGIN
  -- Récupérer les informations du fonds
  SELECT cf.* INTO fund_info
  FROM public.collective_funds cf
  WHERE cf.id = NEW.fund_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom du contributeur
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Anonyme')
  INTO contributor_name
  FROM public.profiles p
  WHERE p.user_id = NEW.contributor_id;
  
  -- Calculer le montant restant après cette contribution
  remaining_amount := fund_info.target_amount - (fund_info.current_amount + NEW.amount);
  
  -- Créer l'activité de contribution
  PERFORM public.create_fund_activity(
    NEW.fund_id,
    NEW.contributor_id,
    'contribution',
    NEW.amount,
    COALESCE(contributor_name, 'Anonyme') || ' a ajouté ' || NEW.amount || ' ' || NEW.currency || 
    CASE 
      WHEN remaining_amount <= 0 THEN ' - Objectif atteint ! 🎉'
      ELSE ' - Plus que ' || remaining_amount || ' ' || NEW.currency || ' pour atteindre l''objectif !'
    END,
    jsonb_build_object(
      'contributor_name', COALESCE(contributor_name, 'Anonyme'),
      'remaining_amount', remaining_amount,
      'progress_percentage', ROUND(((fund_info.current_amount + NEW.amount)::numeric / fund_info.target_amount::numeric) * 100, 2)
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Recréer tous les triggers
CREATE TRIGGER fund_contribution_activity
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.handle_contribution_activity();

CREATE TRIGGER award_points_contribution
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.award_points_contribution();

CREATE TRIGGER update_fund_current_amount
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_fund_current_amount();