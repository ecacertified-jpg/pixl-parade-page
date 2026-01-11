-- Fonction RPC pour récupérer les statistiques utilisateur (admin seulement)
-- Contourne les politiques RLS grâce à SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_user_stats_for_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_gifts_given integer;
  v_gifts_received integer;
  v_funds_created integer;
  v_friends_count integer;
  v_contributions_count integer;
  v_total_contributed numeric;
  v_community_points integer;
  v_invitations_sent integer;
  v_invitations_accepted integer;
  v_referrals_count integer;
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

  -- Nombre d'amis (relations)
  SELECT COUNT(*) INTO v_friends_count
  FROM contact_relationships 
  WHERE user_a = target_user_id OR user_b = target_user_id;

  -- Contributions
  SELECT COUNT(*), COALESCE(SUM(amount), 0) 
  INTO v_contributions_count, v_total_contributed
  FROM fund_contributions WHERE contributor_id = target_user_id;

  -- Points communauté
  SELECT COALESCE(total_points, 0) INTO v_community_points
  FROM community_scores WHERE user_id = target_user_id;

  -- Invitations envoyées
  SELECT COUNT(*) INTO v_invitations_sent
  FROM invitations WHERE inviter_id = target_user_id;

  -- Invitations acceptées
  SELECT COUNT(*) INTO v_invitations_accepted
  FROM invitations WHERE inviter_id = target_user_id AND status = 'accepted';

  -- Parrainages (codes de parrainage utilisés)
  SELECT COUNT(*) INTO v_referrals_count
  FROM referral_codes WHERE user_id = target_user_id;

  -- Construire le résultat JSON
  result := jsonb_build_object(
    'giftsGiven', COALESCE(v_gifts_given, 0),
    'giftsReceived', COALESCE(v_gifts_received, 0),
    'fundsCreated', COALESCE(v_funds_created, 0),
    'friendsCount', COALESCE(v_friends_count, 0),
    'contributionsCount', COALESCE(v_contributions_count, 0),
    'totalContributed', COALESCE(v_total_contributed, 0),
    'communityPoints', COALESCE(v_community_points, 0),
    'invitationsSent', COALESCE(v_invitations_sent, 0),
    'invitationsAccepted', COALESCE(v_invitations_accepted, 0),
    'referralsCount', COALESCE(v_referrals_count, 0)
  );

  RETURN result;
END;
$$;

-- Accorder les permissions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_user_stats_for_admin(uuid) TO authenticated;

-- Documentation
COMMENT ON FUNCTION public.get_user_stats_for_admin IS 
  'Récupère les statistiques d''un utilisateur pour l''admin - SECURITY DEFINER pour contourner RLS';