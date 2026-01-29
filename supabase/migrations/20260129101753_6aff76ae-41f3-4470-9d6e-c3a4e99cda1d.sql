-- Modification pour compter les contacts (carnet d'adresses) 
-- au lieu des contact_relationships

CREATE OR REPLACE FUNCTION public.get_user_stats_for_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  v_gifts_given integer;
  v_gifts_received integer;
  v_funds_created integer;
  v_contacts_count integer;
  v_contributions_count integer;
  v_total_contributed numeric;
  v_community_points integer;
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Cadeaux donnés
  SELECT COUNT(*) INTO v_gifts_given
  FROM gifts WHERE giver_id = target_user_id;

  -- Cadeaux reçus
  SELECT COUNT(*) INTO v_gifts_received
  FROM gifts WHERE receiver_id = target_user_id;

  -- Cagnottes créées
  SELECT COUNT(*) INTO v_funds_created
  FROM collective_funds WHERE creator_id = target_user_id;

  -- Nombre de contacts dans le carnet d'adresses
  SELECT COUNT(*) INTO v_contacts_count
  FROM contacts WHERE user_id = target_user_id;

  -- Contributions
  SELECT COUNT(*), COALESCE(SUM(amount), 0) 
  INTO v_contributions_count, v_total_contributed
  FROM fund_contributions WHERE contributor_id = target_user_id;

  -- Points communauté
  SELECT COALESCE(total_points, 0) INTO v_community_points
  FROM community_scores WHERE user_id = target_user_id;

  result := jsonb_build_object(
    'giftsGiven', COALESCE(v_gifts_given, 0),
    'giftsReceived', COALESCE(v_gifts_received, 0),
    'fundsCreated', COALESCE(v_funds_created, 0),
    'friendsCount', COALESCE(v_contacts_count, 0),
    'contributionsCount', COALESCE(v_contributions_count, 0),
    'totalContributed', COALESCE(v_total_contributed, 0),
    'communityPoints', COALESCE(v_community_points, 0)
  );

  RETURN result;
END;
$$;