-- Fonction RPC sécurisée pour récupérer l'email d'un utilisateur (réservée aux admins)
CREATE OR REPLACE FUNCTION get_user_email_for_admin(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  
  RETURN (SELECT email FROM auth.users WHERE id = target_user_id);
END;
$$;

-- Accorder l'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_user_email_for_admin(uuid) TO authenticated;