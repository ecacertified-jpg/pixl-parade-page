-- Loyalty points
CREATE OR REPLACE FUNCTION public.award_points_contribution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE fund_title text;
BEGIN
  IF NEW.contributor_id IS NULL THEN RETURN NEW; END IF;
  SELECT title INTO fund_title FROM public.collective_funds WHERE id = NEW.fund_id;
  PERFORM public.add_loyalty_points(
    NEW.contributor_id,
    public.calculate_loyalty_points('fund_contribution', NEW.amount),
    'fund_contribution', NULL,
    'Points gagnés pour votre contribution de ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'XOF') || ' à "' || COALESCE(fund_title, 'cagnotte') || '"'
  );
  RETURN NEW;
END; $function$;

-- Reciprocity tracking
CREATE OR REPLACE FUNCTION public.track_contribution_for_reciprocity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE beneficiary_user_id UUID; fund_occasion TEXT;
BEGIN
  IF NEW.contributor_id IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(c.user_id, cf.creator_id), cf.occasion
  INTO beneficiary_user_id, fund_occasion
  FROM public.collective_funds cf
  LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
  WHERE cf.id = NEW.fund_id;
  IF beneficiary_user_id IS NOT NULL AND beneficiary_user_id != NEW.contributor_id THEN
    INSERT INTO public.reciprocity_tracking (donor_id, beneficiary_id, fund_id, contribution_amount, currency, occasion)
    VALUES (NEW.contributor_id, beneficiary_user_id, NEW.fund_id, NEW.amount, NEW.currency, fund_occasion);
    PERFORM public.update_reciprocity_score(NEW.contributor_id);
  END IF;
  RETURN NEW;
END; $function$;

-- Contribution activity
CREATE OR REPLACE FUNCTION public.handle_contribution_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE fund_info RECORD; contributor_name TEXT; remaining_amount NUMERIC;
BEGIN
  IF NEW.contributor_id IS NULL THEN RETURN NEW; END IF;
  SELECT cf.* INTO fund_info FROM public.collective_funds cf WHERE cf.id = NEW.fund_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Anonyme')
  INTO contributor_name FROM public.profiles p WHERE p.user_id = NEW.contributor_id;
  remaining_amount := fund_info.target_amount - (fund_info.current_amount + NEW.amount);
  PERFORM public.create_fund_activity(
    NEW.fund_id, NEW.contributor_id, 'contribution', NEW.amount,
    COALESCE(contributor_name, 'Anonyme') || ' a ajouté ' || NEW.amount || ' ' || NEW.currency ||
    CASE WHEN remaining_amount <= 0 THEN ' - Objectif atteint ! 🎉'
         ELSE ' - Plus que ' || remaining_amount || ' ' || NEW.currency || ' pour atteindre l''objectif !' END,
    jsonb_build_object(
      'contributor_name', COALESCE(contributor_name, 'Anonyme'),
      'remaining_amount', remaining_amount,
      'progress_percentage', ROUND(((fund_info.current_amount + NEW.amount)::numeric / fund_info.target_amount::numeric) * 100, 2)
    )
  );
  RETURN NEW;
END; $function$;

-- Badge check
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF TG_TABLE_NAME = 'fund_contributions' AND NEW.contributor_id IS NULL THEN
    RETURN NEW;
  END IF;
  RETURN NEW;
END; $function$;
