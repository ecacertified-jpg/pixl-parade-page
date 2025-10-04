-- Phase 1: Infrastructure de Réciprocité Sociale

-- 1.1 Créer la table reciprocity_tracking
CREATE TABLE IF NOT EXISTS public.reciprocity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL,
  beneficiary_id UUID NOT NULL,
  fund_id UUID REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  contribution_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  occasion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT different_users CHECK (donor_id != beneficiary_id)
);

CREATE INDEX IF NOT EXISTS idx_reciprocity_beneficiary ON public.reciprocity_tracking(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_reciprocity_donor ON public.reciprocity_tracking(donor_id);
CREATE INDEX IF NOT EXISTS idx_reciprocity_occasion ON public.reciprocity_tracking(occasion);

-- 1.2 Créer la table reciprocity_scores
CREATE TABLE IF NOT EXISTS public.reciprocity_scores (
  user_id UUID PRIMARY KEY,
  total_contributions_count INTEGER DEFAULT 0,
  total_amount_given NUMERIC DEFAULT 0,
  total_funds_initiated INTEGER DEFAULT 0,
  generosity_score NUMERIC DEFAULT 0,
  badge_level TEXT DEFAULT 'newcomer',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  birthday_contributions INTEGER DEFAULT 0,
  academic_contributions INTEGER DEFAULT 0,
  wedding_contributions INTEGER DEFAULT 0,
  promotion_contributions INTEGER DEFAULT 0
);

-- 1.3 Créer la table user_reciprocity_preferences
CREATE TABLE IF NOT EXISTS public.user_reciprocity_preferences (
  user_id UUID PRIMARY KEY,
  enable_reciprocity_system BOOLEAN DEFAULT TRUE,
  enable_for_birthdays BOOLEAN DEFAULT TRUE,
  enable_for_academic BOOLEAN DEFAULT FALSE,
  enable_for_weddings BOOLEAN DEFAULT FALSE,
  enable_for_promotions BOOLEAN DEFAULT FALSE,
  show_generosity_badge BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reciprocity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciprocity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reciprocity_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reciprocity_tracking
CREATE POLICY "Users can view their own reciprocity data"
  ON public.reciprocity_tracking FOR SELECT
  USING (auth.uid() = donor_id OR auth.uid() = beneficiary_id);

-- RLS Policies for reciprocity_scores
CREATE POLICY "Users can view all scores"
  ON public.reciprocity_scores FOR SELECT
  USING (true);

-- RLS Policies for user_reciprocity_preferences
CREATE POLICY "Users manage their own preferences"
  ON public.user_reciprocity_preferences FOR ALL
  USING (auth.uid() = user_id);

-- 2.1 Fonction update_reciprocity_score
CREATE OR REPLACE FUNCTION public.update_reciprocity_score(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contrib_count INTEGER;
  total_given NUMERIC;
  funds_created INTEGER;
  score NUMERIC;
  badge TEXT;
  birthday_count INTEGER;
  academic_count INTEGER;
  wedding_count INTEGER;
  promotion_count INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(contribution_amount), 0),
    COUNT(DISTINCT fund_id)
  INTO contrib_count, total_given, funds_created
  FROM public.reciprocity_tracking
  WHERE donor_id = user_uuid;
  
  SELECT 
    COUNT(*) FILTER (WHERE occasion = 'birthday'),
    COUNT(*) FILTER (WHERE occasion = 'academic'),
    COUNT(*) FILTER (WHERE occasion = 'wedding'),
    COUNT(*) FILTER (WHERE occasion = 'promotion')
  INTO birthday_count, academic_count, wedding_count, promotion_count
  FROM public.reciprocity_tracking
  WHERE donor_id = user_uuid;
  
  score := LEAST(100, (contrib_count * 10) + (funds_created * 20) + (total_given / 10000));
  
  badge := CASE
    WHEN score >= 80 THEN 'champion'
    WHEN score >= 50 THEN 'generous'
    WHEN score >= 20 THEN 'helper'
    ELSE 'newcomer'
  END;
  
  INSERT INTO public.reciprocity_scores (
    user_id,
    total_contributions_count,
    total_amount_given,
    total_funds_initiated,
    generosity_score,
    badge_level,
    birthday_contributions,
    academic_contributions,
    wedding_contributions,
    promotion_contributions
  ) VALUES (
    user_uuid, contrib_count, total_given, funds_created, score, badge,
    birthday_count, academic_count, wedding_count, promotion_count
  ) ON CONFLICT (user_id) DO UPDATE SET
    total_contributions_count = EXCLUDED.total_contributions_count,
    total_amount_given = EXCLUDED.total_amount_given,
    total_funds_initiated = EXCLUDED.total_funds_initiated,
    generosity_score = EXCLUDED.generosity_score,
    badge_level = EXCLUDED.badge_level,
    birthday_contributions = EXCLUDED.birthday_contributions,
    academic_contributions = EXCLUDED.academic_contributions,
    wedding_contributions = EXCLUDED.wedding_contributions,
    promotion_contributions = EXCLUDED.promotion_contributions,
    last_calculated_at = NOW();
END;
$$;

-- 2.2 Fonction track_contribution_for_reciprocity
CREATE OR REPLACE FUNCTION public.track_contribution_for_reciprocity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beneficiary_user_id UUID;
  fund_occasion TEXT;
BEGIN
  SELECT 
    COALESCE(c.user_id, cf.creator_id),
    cf.occasion
  INTO beneficiary_user_id, fund_occasion
  FROM public.collective_funds cf
  LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
  WHERE cf.id = NEW.fund_id;
  
  IF beneficiary_user_id IS NOT NULL AND beneficiary_user_id != NEW.contributor_id THEN
    INSERT INTO public.reciprocity_tracking (
      donor_id, 
      beneficiary_id, 
      fund_id, 
      contribution_amount, 
      currency, 
      occasion
    ) VALUES (
      NEW.contributor_id,
      beneficiary_user_id,
      NEW.fund_id,
      NEW.amount,
      NEW.currency,
      fund_occasion
    );
    
    PERFORM public.update_reciprocity_score(NEW.contributor_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2.3 Fonction get_reciprocity_candidates
CREATE OR REPLACE FUNCTION public.get_reciprocity_candidates(fund_uuid UUID)
RETURNS TABLE (
  candidate_id UUID,
  candidate_name TEXT,
  past_contribution_amount NUMERIC,
  past_contribution_date TIMESTAMPTZ,
  generosity_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.donor_id AS candidate_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, 'Utilisateur') AS candidate_name,
    rt.contribution_amount AS past_contribution_amount,
    rt.created_at AS past_contribution_date,
    COALESCE(rs.generosity_score, 0) AS generosity_score
  FROM public.reciprocity_tracking rt
  INNER JOIN public.collective_funds cf ON cf.id = fund_uuid
  LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
  LEFT JOIN public.profiles p ON p.user_id = rt.donor_id
  LEFT JOIN public.reciprocity_scores rs ON rs.user_id = rt.donor_id
  LEFT JOIN public.user_reciprocity_preferences urp ON urp.user_id = rt.donor_id
  WHERE rt.beneficiary_id = COALESCE(c.user_id, cf.creator_id)
    AND (urp.enable_reciprocity_system IS NULL OR urp.enable_reciprocity_system = TRUE)
    AND rt.donor_id != cf.creator_id
    AND (
      (urp.enable_for_birthdays = TRUE AND cf.occasion = 'birthday') OR
      (urp.enable_for_academic = TRUE AND cf.occasion = 'academic') OR
      (urp.enable_for_weddings = TRUE AND cf.occasion = 'wedding') OR
      (urp.enable_for_promotions = TRUE AND cf.occasion = 'promotion') OR
      (urp.enable_for_birthdays IS NULL AND cf.occasion = 'birthday')
    )
  ORDER BY rt.created_at DESC;
END;
$$;

-- 2.4 Fonction notify_reciprocity_on_fund_creation
CREATE OR REPLACE FUNCTION public.notify_reciprocity_on_fund_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify('fund_created_reciprocity', NEW.id::text);
  RETURN NEW;
END;
$$;

-- 3. Créer les triggers
DROP TRIGGER IF EXISTS after_contribution_track_reciprocity ON public.fund_contributions;
CREATE TRIGGER after_contribution_track_reciprocity
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.track_contribution_for_reciprocity();

DROP TRIGGER IF EXISTS after_fund_creation_notify_reciprocity ON public.collective_funds;
CREATE TRIGGER after_fund_creation_notify_reciprocity
  AFTER INSERT ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reciprocity_on_fund_creation();