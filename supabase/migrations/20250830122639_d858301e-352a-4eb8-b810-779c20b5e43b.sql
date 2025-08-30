-- Phase 1: Correction de l'erreur fund_id et implémentation du système d'amitié

-- Premièrement, vérifions et corrigeons les triggers existants qui pourraient causer l'erreur fund_id
DROP TRIGGER IF EXISTS fund_contribution_activity ON public.fund_contributions;
DROP TRIGGER IF EXISTS award_points_contribution ON public.fund_contributions;
DROP TRIGGER IF EXISTS update_fund_current_amount ON public.fund_contributions;

-- Recréer les triggers correctement
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
  SELECT cf.*, cf.target_amount - cf.current_amount as remaining
  INTO fund_info
  FROM public.collective_funds cf
  WHERE cf.id = NEW.fund_id;
  
  -- Récupérer le nom du contributeur
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Anonyme')
  INTO contributor_name
  FROM public.profiles p
  WHERE p.user_id = NEW.contributor_id;
  
  remaining_amount := fund_info.target_amount - fund_info.current_amount;
  
  -- Créer l'activité de contribution
  PERFORM public.create_fund_activity(
    NEW.fund_id,
    NEW.contributor_id,
    'contribution',
    NEW.amount,
    contributor_name || ' a ajouté ' || NEW.amount || ' ' || NEW.currency || 
    CASE 
      WHEN remaining_amount <= 0 THEN ' - Objectif atteint ! 🎉'
      ELSE ' - Plus que ' || remaining_amount || ' ' || NEW.currency || ' pour atteindre l''objectif !'
    END,
    jsonb_build_object(
      'contributor_name', contributor_name,
      'remaining_amount', remaining_amount,
      'progress_percentage', ROUND((fund_info.current_amount::numeric / fund_info.target_amount::numeric) * 100, 2)
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Recréer le trigger pour les activités
CREATE TRIGGER fund_contribution_activity
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.handle_contribution_activity();

-- Recréer le trigger pour les points de fidélité
CREATE TRIGGER award_points_contribution
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.award_points_contribution();

-- Recréer le trigger pour mettre à jour le montant actuel
CREATE TRIGGER update_fund_current_amount
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_fund_current_amount();

-- Phase 2: Mettre à jour les cotisations pour qu'elles ne soient plus publiques par défaut
UPDATE public.collective_funds 
SET is_public = false 
WHERE is_public = true;

-- Ajouter une colonne can_see_funds à contact_relationships si elle n'existe pas
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

-- Mettre à jour les relations existantes pour permettre la vue des cotisations
UPDATE public.contact_relationships 
SET can_see_funds = true 
WHERE can_see_funds IS NULL;

-- Phase 3: Mettre à jour les fonctions RLS pour le système d'amitié
CREATE OR REPLACE FUNCTION public.user_can_see_fund(fund_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- L'utilisateur peut voir ses propres cotisations
  IF EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid AND creator_id = user_uuid
  ) THEN
    RETURN true;
  END IF;

  -- L'utilisateur peut voir les cotisations de ses amis (avec can_see_funds = true)
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.contact_relationships cr ON 
      (cf.creator_id = cr.user_a AND cr.user_b = user_uuid AND cr.can_see_funds = true) OR
      (cf.creator_id = cr.user_b AND cr.user_a = user_uuid AND cr.can_see_funds = true)
    WHERE cf.id = fund_uuid
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
  
  -- Si l'utilisateur n'est pas authentifié, il ne peut pas contribuer
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si la cotisation est active
  IF NOT EXISTS (
    SELECT 1 FROM public.collective_funds 
    WHERE id = fund_uuid AND status = 'active'
  ) THEN
    RETURN false;
  END IF;
  
  -- Récupérer le créateur de la cotisation
  SELECT creator_id INTO fund_creator_id 
  FROM public.collective_funds 
  WHERE id = fund_uuid;
  
  -- Le créateur peut contribuer à sa propre cotisation
  IF fund_creator_id = current_user_id THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur est ami avec le créateur et peut voir ses cotisations
  RETURN EXISTS (
    SELECT 1 FROM public.contact_relationships 
    WHERE ((user_a = current_user_id AND user_b = fund_creator_id) OR
           (user_a = fund_creator_id AND user_b = current_user_id))
    AND can_see_funds = true
  );
END;
$function$;

-- Phase 4: Mettre à jour les politiques RLS
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view collective funds they created or contributed to" ON public.collective_funds;
DROP POLICY IF EXISTS "Public funds are viewable via share token" ON public.collective_funds;
DROP POLICY IF EXISTS "Users can contribute to funds they can access" ON public.fund_contributions;

-- Créer les nouvelles politiques pour collective_funds
CREATE POLICY "Users can view funds they can access"
  ON public.collective_funds
  FOR SELECT
  USING (public.user_can_see_fund(id, auth.uid()));

CREATE POLICY "Users can create their own collective funds"
  ON public.collective_funds
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own collective funds"
  ON public.collective_funds
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own collective funds"
  ON public.collective_funds
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Créer les nouvelles politiques pour fund_contributions
CREATE POLICY "Users can contribute to accessible funds"
  ON public.fund_contributions
  FOR INSERT
  WITH CHECK (public.can_contribute_to_fund(fund_id) AND auth.uid() = contributor_id);

CREATE POLICY "Users can view contributions to accessible funds"
  ON public.fund_contributions
  FOR SELECT
  USING (public.user_can_see_fund(fund_id, auth.uid()));