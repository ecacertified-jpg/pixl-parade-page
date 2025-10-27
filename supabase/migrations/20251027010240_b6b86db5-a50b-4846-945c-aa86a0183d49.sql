-- Mettre à jour le flag is_business pour tous les utilisateurs ayant un business_account actif
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_business}',
  'true'::jsonb
)
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.business_accounts 
  WHERE is_active = true
);

-- Créer un trigger pour mettre à jour automatiquement le flag is_business
CREATE OR REPLACE FUNCTION public.update_user_business_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un business_account est créé ou activé
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{is_business}',
      'true'::jsonb
    )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_business_flag
AFTER INSERT OR UPDATE ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_business_flag();