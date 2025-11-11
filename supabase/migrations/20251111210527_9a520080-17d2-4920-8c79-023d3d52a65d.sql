-- Create function to automatically check and award badges after user actions
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Determine which user to check based on the table
  IF TG_TABLE_NAME = 'fund_contributions' THEN
    target_user_id := NEW.contributor_id;
  ELSIF TG_TABLE_NAME = 'collective_funds' THEN
    target_user_id := NEW.creator_id;
  ELSIF TG_TABLE_NAME = 'contacts' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'gift_thanks' THEN
    target_user_id := NEW.sender_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Use pg_notify to trigger async badge check (to avoid blocking the transaction)
  PERFORM pg_notify('badge_check', target_user_id::text);
  
  RETURN NEW;
END;
$$;

-- Create triggers for automatic badge checking
DROP TRIGGER IF EXISTS trigger_badge_check_on_contribution ON public.fund_contributions;
CREATE TRIGGER trigger_badge_check_on_contribution
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

DROP TRIGGER IF EXISTS trigger_badge_check_on_fund_creation ON public.collective_funds;
CREATE TRIGGER trigger_badge_check_on_fund_creation
  AFTER INSERT ON public.collective_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

DROP TRIGGER IF EXISTS trigger_badge_check_on_friend_add ON public.contacts;
CREATE TRIGGER trigger_badge_check_on_friend_add
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

DROP TRIGGER IF EXISTS trigger_badge_check_on_thanks ON public.gift_thanks;
CREATE TRIGGER trigger_badge_check_on_thanks
  AFTER INSERT ON public.gift_thanks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

-- Function to get user's badge progress for all categories
CREATE OR REPLACE FUNCTION public.get_user_badge_progress(p_user_id UUID)
RETURNS TABLE(
  category TEXT,
  contribution_count INTEGER,
  total_amount_donated NUMERIC,
  funds_created INTEGER,
  successful_funds INTEGER,
  friends_count INTEGER,
  thanks_sent INTEGER,
  surprise_events INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'summary'::TEXT as category,
    (SELECT COUNT(*)::INTEGER FROM public.fund_contributions WHERE contributor_id = p_user_id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.fund_contributions WHERE contributor_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.collective_funds WHERE creator_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.collective_funds WHERE creator_id = p_user_id AND current_amount >= target_amount),
    (SELECT COUNT(*)::INTEGER FROM public.contacts WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.gift_thanks WHERE sender_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.collective_funds WHERE creator_id = p_user_id AND is_surprise = true);
END;
$$;