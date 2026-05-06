CREATE OR REPLACE FUNCTION public.create_auto_gratitude()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_creator UUID;
  contributor_name TEXT;
  fund_title TEXT;
BEGIN
  SELECT creator_id, title INTO fund_creator, fund_title
  FROM public.collective_funds WHERE id = NEW.fund_id;

  -- Skip auto-gratitude for guest contributions (gratitude_wall.contributor_id is NOT NULL)
  IF NEW.contributor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(first_name || ' ' || last_name, 'Un généreux donateur')
  INTO contributor_name
  FROM public.profiles WHERE user_id = NEW.contributor_id;

  INSERT INTO public.gratitude_wall (
    fund_id, contributor_id, beneficiary_id,
    message_type, message_text, is_public
  ) VALUES (
    NEW.fund_id, NEW.contributor_id, fund_creator, 'auto',
    '✨ ' || contributor_name || ' a contribué ' || NEW.amount || ' ' || NEW.currency ||
    ' à la cagnotte "' || fund_title || '". Merci pour ce geste généreux ! 💝',
    true
  );

  RETURN NEW;
END;
$function$;