-- Créer une fonction pour vérifier les cotisations actives pour un bénéficiaire
CREATE OR REPLACE FUNCTION public.has_active_fund_for_beneficiary(p_beneficiary_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  active_fund_count integer;
BEGIN
  -- Compter les cotisations actives pour ce bénéficiaire
  SELECT COUNT(*) INTO active_fund_count
  FROM public.collective_funds cf
  WHERE cf.beneficiary_contact_id IN (
    SELECT c.id FROM public.contacts c 
    WHERE c.user_id = p_beneficiary_user_id
  )
  AND cf.status IN ('active', 'target_reached')
  AND (cf.current_amount < cf.target_amount OR cf.current_amount IS NULL);
  
  -- Compter aussi les cotisations business actives
  SELECT COUNT(*) + active_fund_count INTO active_fund_count
  FROM public.business_collective_funds bcf
  JOIN public.collective_funds cf ON cf.id = bcf.fund_id
  WHERE bcf.beneficiary_user_id = p_beneficiary_user_id
  AND cf.status IN ('active', 'target_reached')
  AND (cf.current_amount < cf.target_amount OR cf.current_amount IS NULL);
  
  RETURN active_fund_count > 0;
END;
$$;

-- Créer une fonction RPC pour créer des cotisations business avec validation
CREATE OR REPLACE FUNCTION public.create_business_collective_fund(
  p_business_id uuid,
  p_product_id uuid,
  p_beneficiary_user_id uuid,
  p_target_amount numeric,
  p_currency text DEFAULT 'XOF',
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_auto_notifications boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  fund_id uuid;
  business_collective_fund_id uuid;
  final_title text;
  product_name text;
  beneficiary_name text;
BEGIN
  -- Vérifier si l'utilisateur a déjà une cotisation active
  IF public.has_active_fund_for_beneficiary(p_beneficiary_user_id) THEN
    RAISE EXCEPTION 'Une cotisation est déjà en cours pour ce bénéficiaire. Veuillez attendre qu''elle soit terminée avant d''en créer une nouvelle.';
  END IF;

  -- Récupérer le nom du produit pour le titre
  SELECT name INTO product_name FROM public.products WHERE id = p_product_id;
  
  -- Récupérer le nom du bénéficiaire
  SELECT COALESCE(first_name || ' ' || last_name, first_name, 'Utilisateur') 
  INTO beneficiary_name 
  FROM public.profiles 
  WHERE user_id = p_beneficiary_user_id;

  -- Générer un titre si non fourni
  final_title := COALESCE(p_title, 'Cotisation pour ' || COALESCE(product_name, 'produit') || ' - ' || COALESCE(beneficiary_name, 'bénéficiaire'));

  -- Créer la cotisation collective
  INSERT INTO public.collective_funds (
    creator_id,
    title,
    description,
    target_amount,
    currency,
    status,
    created_by_business_id,
    business_product_id
  ) VALUES (
    auth.uid(),
    final_title,
    p_description,
    p_target_amount,
    p_currency,
    'active',
    p_business_id,
    p_product_id
  ) RETURNING id INTO fund_id;

  -- Créer l'entrée business_collective_funds
  INSERT INTO public.business_collective_funds (
    fund_id,
    business_id,
    product_id,
    beneficiary_user_id,
    auto_notifications
  ) VALUES (
    fund_id,
    p_business_id,
    p_product_id,
    p_beneficiary_user_id,
    p_auto_notifications
  ) RETURNING id INTO business_collective_fund_id;

  -- Déclencher un événement de rafraîchissement
  PERFORM pg_notify('refresh_business_funds', fund_id::text);

  RETURN fund_id;
END;
$$;

-- Ajouter un trigger pour valider les cotisations normales
CREATE OR REPLACE FUNCTION public.validate_single_active_fund()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Vérifier seulement si on crée un nouveau fonds avec un bénéficiaire
  IF TG_OP = 'INSERT' AND NEW.beneficiary_contact_id IS NOT NULL THEN
    -- Récupérer l'user_id du bénéficiaire via le contact
    IF EXISTS (
      SELECT 1 FROM public.contacts c 
      WHERE c.id = NEW.beneficiary_contact_id 
      AND public.has_active_fund_for_beneficiary(c.user_id)
    ) THEN
      RAISE EXCEPTION 'Une cotisation est déjà en cours pour ce bénéficiaire. Veuillez attendre qu''elle soit terminée avant d''en créer une nouvelle.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table collective_funds
DROP TRIGGER IF EXISTS validate_single_active_fund_trigger ON public.collective_funds;
CREATE TRIGGER validate_single_active_fund_trigger
  BEFORE INSERT ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_single_active_fund();