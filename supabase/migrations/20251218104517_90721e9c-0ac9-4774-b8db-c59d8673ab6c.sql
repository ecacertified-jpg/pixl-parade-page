
-- =====================================================
-- RECRÉER LES FONCTIONS SECURITY DEFINER
-- =====================================================

-- Drop existing function with specific signature
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, uuid, inet, text, jsonb, text);

-- Create new log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    metadata,
    risk_level
  ) VALUES (
    p_event_type,
    COALESCE(p_user_id, auth.uid()),
    p_ip_address::inet,
    p_user_agent,
    p_metadata,
    p_risk_level
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Create award_user_badge function
CREATE OR REPLACE FUNCTION public.award_user_badge(
  p_user_id UUID,
  p_badge_key TEXT,
  p_awarded_for TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
BEGIN
  SELECT id INTO v_badge_id
  FROM public.badge_definitions
  WHERE badge_key = p_badge_key AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge not found: %', p_badge_key;
  END IF;
  
  SELECT id INTO v_user_badge_id
  FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id = v_badge_id;
  
  IF v_user_badge_id IS NOT NULL THEN
    RETURN v_user_badge_id;
  END IF;
  
  INSERT INTO public.user_badges (user_id, badge_id, awarded_for, metadata)
  VALUES (p_user_id, v_badge_id, p_awarded_for, p_metadata)
  RETURNING id INTO v_user_badge_id;
  
  RETURN v_user_badge_id;
END;
$$;

-- Create create_birthday_celebration function
CREATE OR REPLACE FUNCTION public.create_birthday_celebration(
  p_user_id UUID,
  p_celebration_year INTEGER,
  p_age_at_celebration INTEGER DEFAULT NULL,
  p_milestone_age BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_celebration_id UUID;
BEGIN
  SELECT id INTO v_celebration_id
  FROM public.birthday_celebrations
  WHERE user_id = p_user_id AND celebration_year = p_celebration_year;
  
  IF v_celebration_id IS NOT NULL THEN
    RETURN v_celebration_id;
  END IF;
  
  INSERT INTO public.birthday_celebrations (user_id, celebration_year, age_at_celebration, milestone_age)
  VALUES (p_user_id, p_celebration_year, p_age_at_celebration, p_milestone_age)
  RETURNING id INTO v_celebration_id;
  
  RETURN v_celebration_id;
END;
$$;

-- Create track_referral function
CREATE OR REPLACE FUNCTION public.track_referral(
  p_referral_code_id UUID,
  p_referred_user_id UUID,
  p_conversion_type TEXT DEFAULT 'signup'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tracking_id UUID;
  v_referrer_id UUID;
BEGIN
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE id = p_referral_code_id AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code';
  END IF;
  
  IF v_referrer_id = p_referred_user_id THEN
    RAISE EXCEPTION 'Self-referral not allowed';
  END IF;
  
  SELECT id INTO v_tracking_id
  FROM public.referral_tracking
  WHERE referral_code_id = p_referral_code_id AND referred_user_id = p_referred_user_id;
  
  IF v_tracking_id IS NOT NULL THEN
    RETURN v_tracking_id;
  END IF;
  
  INSERT INTO public.referral_tracking (referral_code_id, referred_user_id, conversion_type)
  VALUES (p_referral_code_id, p_referred_user_id, p_conversion_type)
  RETURNING id INTO v_tracking_id;
  
  UPDATE public.referral_codes
  SET times_used = times_used + 1, updated_at = now()
  WHERE id = p_referral_code_id;
  
  RETURN v_tracking_id;
END;
$$;

-- Create create_imbalance_alert function
CREATE OR REPLACE FUNCTION public.create_imbalance_alert(
  p_user_id UUID,
  p_alert_type TEXT,
  p_severity TEXT,
  p_imbalance_score NUMERIC,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.reciprocity_imbalance_alerts (user_id, alert_type, severity, imbalance_score, details, status)
  VALUES (p_user_id, p_alert_type, p_severity, p_imbalance_score, p_details, 'pending')
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, text, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_user_badge(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_badge(uuid, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_birthday_celebration(uuid, integer, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_birthday_celebration(uuid, integer, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.track_referral(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_imbalance_alert(uuid, text, text, numeric, jsonb) TO service_role;
