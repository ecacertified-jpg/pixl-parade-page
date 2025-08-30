-- Corriger la fonction trigger défaillante update_fund_current_amount
CREATE OR REPLACE FUNCTION public.update_fund_current_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_record RECORD;
BEGIN
  -- Update the current_amount in collective_funds
  UPDATE public.collective_funds 
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.fund_contributions 
    WHERE fund_id = NEW.fund_id
  )
  WHERE id = NEW.fund_id;
  
  -- Get fund record for notification check
  SELECT cf.*, p.first_name, p.last_name 
  INTO fund_record
  FROM public.collective_funds cf
  LEFT JOIN public.profiles p ON p.user_id = cf.creator_id
  WHERE cf.id = NEW.fund_id;
  
  -- Check if target is reached and create notification
  IF fund_record.current_amount >= fund_record.target_amount AND fund_record.status = 'active' THEN
    -- Create notification for fund creator
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      fund_record.creator_id,
      'Objectif atteint ! 🎉',
      'Votre cagnotte "' || fund_record.title || '" a atteint son objectif de ' || fund_record.target_amount || ' ' || fund_record.currency || '. Vous pouvez maintenant finaliser la commande.',
      'fund_target_reached'
    );
    
    -- Update fund status to target_reached
    UPDATE public.collective_funds 
    SET status = 'target_reached' 
    WHERE id = NEW.fund_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer les triggers dans le bon ordre après correction de la fonction
DROP TRIGGER IF EXISTS update_fund_current_amount_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS handle_contribution_activity_trigger ON public.fund_contributions;
DROP TRIGGER IF EXISTS award_points_contribution_trigger ON public.fund_contributions;

CREATE TRIGGER update_fund_current_amount_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fund_current_amount();

CREATE TRIGGER handle_contribution_activity_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contribution_activity();

CREATE TRIGGER award_points_contribution_trigger
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_contribution();