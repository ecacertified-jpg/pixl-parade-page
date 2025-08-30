-- Corriger la fonction award_points_contribution qui cause l'erreur fund_id
CREATE OR REPLACE FUNCTION public.award_points_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_title text;
BEGIN
  -- Récupérer le titre de la cagnotte
  SELECT title INTO fund_title
  FROM public.collective_funds
  WHERE id = NEW.fund_id;
  
  -- Attribuer des points pour la contribution
  -- Utiliser NULL pour source_id au lieu de NEW.id qui peut causer des problèmes
  PERFORM public.add_loyalty_points(
    NEW.contributor_id,
    public.calculate_loyalty_points('fund_contribution', NEW.amount),
    'fund_contribution',
    NULL, -- Changed from NEW.id to NULL to avoid trigger context issues
    'Points gagnés pour votre contribution de ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'XOF') || ' à "' || COALESCE(fund_title, 'cagnotte') || '"'
  );
  
  RETURN NEW;
END;
$$;