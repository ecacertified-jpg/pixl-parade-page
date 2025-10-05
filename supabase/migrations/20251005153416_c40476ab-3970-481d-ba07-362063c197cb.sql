-- Corriger d'abord l'erreur de récursion infinie dans les RLS policies
-- Créer une fonction security definer pour vérifier si un utilisateur peut voir un fonds

CREATE OR REPLACE FUNCTION public.is_beneficiary_of_surprise(fund_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
    WHERE cf.id = fund_uuid
    AND c.user_id = user_uuid
    AND cf.is_surprise = true
    AND (cf.surprise_reveal_date IS NULL OR cf.surprise_reveal_date <= now())
  );
END;
$$;

-- Recréer la policy sans récursion
DROP POLICY IF EXISTS "Users can view funds with friend access" ON public.collective_funds;

CREATE POLICY "Users can view funds with friend access"
ON public.collective_funds FOR SELECT
USING (
  auth.uid() = creator_id 
  OR is_public = true 
  OR EXISTS (
    SELECT 1 FROM fund_contributions fc
    WHERE fc.fund_id = collective_funds.id AND fc.contributor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM contact_relationships cr
    WHERE ((cr.user_a = auth.uid() AND cr.user_b = collective_funds.creator_id) 
    OR (cr.user_b = auth.uid() AND cr.user_a = collective_funds.creator_id))
    AND cr.can_see_funds = true
  )
  OR can_see_fund_for_friend(id, auth.uid())
  -- Utiliser la fonction security definer pour éviter la récursion
  OR is_beneficiary_of_surprise(id, auth.uid())
  -- Permettre aux contributeurs invités de voir la surprise
  OR EXISTS (
    SELECT 1 FROM surprise_contributors sc
    WHERE sc.fund_id = collective_funds.id AND sc.contributor_id = auth.uid()
  )
);

-- Table pour les notifications intelligentes (extension de scheduled_notifications)
-- Ajouter des colonnes pour les métadonnées de notifications intelligentes
ALTER TABLE public.scheduled_notifications
ADD COLUMN IF NOT EXISTS smart_notification_category TEXT,
ADD COLUMN IF NOT EXISTS action_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50;

-- Index pour les notifications intelligentes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_smart_category 
ON public.scheduled_notifications(smart_notification_category) 
WHERE smart_notification_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_priority 
ON public.scheduled_notifications(priority_score DESC);

-- Fonction pour détecter un déséquilibre de réciprocité (Alerte Équilibre)
CREATE OR REPLACE FUNCTION public.detect_reciprocity_imbalance(p_user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  friend_name TEXT,
  received_count INTEGER,
  given_count INTEGER,
  imbalance_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_gifts AS (
    SELECT 
      CASE 
        WHEN rt.donor_id = p_user_id THEN rt.beneficiary_id
        WHEN rt.beneficiary_id = p_user_id THEN rt.donor_id
      END as friend_id,
      COUNT(*) FILTER (WHERE rt.beneficiary_id = p_user_id) as received,
      COUNT(*) FILTER (WHERE rt.donor_id = p_user_id) as given
    FROM public.reciprocity_tracking rt
    WHERE p_user_id IN (rt.donor_id, rt.beneficiary_id)
    AND rt.created_at > now() - INTERVAL '1 year'
    GROUP BY friend_id
    HAVING COUNT(*) FILTER (WHERE rt.beneficiary_id = p_user_id) >= 3
    AND COUNT(*) FILTER (WHERE rt.donor_id = p_user_id) = 0
  )
  SELECT 
    ug.friend_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, 'Ami') as friend_name,
    ug.received::INTEGER,
    ug.given::INTEGER,
    (ug.received * 10)::INTEGER as imbalance_score
  FROM user_gifts ug
  LEFT JOIN public.profiles p ON p.user_id = ug.friend_id
  ORDER BY imbalance_score DESC;
END;
$$;

-- Fonction pour détecter l'effet domino (Effet Domino)
CREATE OR REPLACE FUNCTION public.detect_domino_effect(p_fund_id UUID, p_contributor_id UUID)
RETURNS TABLE(
  triggered_contributions INTEGER,
  total_amount_triggered NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contribution_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer l'heure de la contribution initiale
  SELECT created_at INTO contribution_time
  FROM public.fund_contributions
  WHERE fund_id = p_fund_id AND contributor_id = p_contributor_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF contribution_time IS NULL THEN
    RETURN QUERY SELECT 0::INTEGER, 0::NUMERIC;
    RETURN;
  END IF;

  -- Compter les contributions qui ont suivi dans les 24h
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as triggered_contributions,
    COALESCE(SUM(amount), 0) as total_amount_triggered
  FROM public.fund_contributions
  WHERE fund_id = p_fund_id
  AND contributor_id != p_contributor_id
  AND created_at > contribution_time
  AND created_at <= contribution_time + INTERVAL '24 hours';
END;
$$;

-- Fonction pour détecter les anniversaires imminents sans cagnotte (Rappel Douceur)
CREATE OR REPLACE FUNCTION public.detect_upcoming_birthdays_without_fund(p_user_id UUID)
RETURNS TABLE(
  contact_id UUID,
  contact_name TEXT,
  birthday DATE,
  days_until INTEGER,
  existing_contributors INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH upcoming_birthdays AS (
    SELECT 
      c.id,
      c.name,
      c.birthday,
      EXTRACT(DAY FROM (
        CASE 
          WHEN DATE_PART('month', c.birthday) < DATE_PART('month', CURRENT_DATE) OR
               (DATE_PART('month', c.birthday) = DATE_PART('month', CURRENT_DATE) AND 
                DATE_PART('day', c.birthday) < DATE_PART('day', CURRENT_DATE))
          THEN DATE(DATE_PART('year', CURRENT_DATE) + 1 || '-' || DATE_PART('month', c.birthday) || '-' || DATE_PART('day', c.birthday))
          ELSE DATE(DATE_PART('year', CURRENT_DATE) || '-' || DATE_PART('month', c.birthday) || '-' || DATE_PART('day', c.birthday))
        END - CURRENT_DATE
      ))::INTEGER as days_until
    FROM public.contacts c
    WHERE c.user_id = p_user_id
    AND c.birthday IS NOT NULL
  )
  SELECT 
    ub.id as contact_id,
    ub.name as contact_name,
    ub.birthday,
    ub.days_until,
    COALESCE(
      (SELECT COUNT(DISTINCT fc.contributor_id)
       FROM public.collective_funds cf
       JOIN public.fund_contributions fc ON fc.fund_id = cf.id
       WHERE cf.beneficiary_contact_id = ub.id
       AND cf.status = 'active'
       AND cf.occasion = 'birthday'),
      0
    )::INTEGER as existing_contributors
  FROM upcoming_birthdays ub
  WHERE ub.days_until BETWEEN 3 AND 7
  AND NOT EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.beneficiary_contact_id = ub.id
    AND cf.creator_id = p_user_id
    AND cf.status = 'active'
    AND cf.occasion = 'birthday'
  )
  ORDER BY ub.days_until ASC;
END;
$$;