-- Fonction pour promouvoir un utilisateur en Super Admin par email
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Trouver l'utilisateur par email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Erreur: Aucun utilisateur trouvé avec cet email';
  END IF;
  
  -- Vérifier si déjà admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = target_user_id
  ) INTO admin_exists;
  
  IF admin_exists THEN
    -- Mettre à jour en super_admin si déjà existant
    UPDATE admin_users
    SET role = 'super_admin',
        is_active = true,
        permissions = jsonb_build_object(
          'manage_users', true,
          'manage_admins', true,
          'manage_content', true,
          'manage_finances', true,
          'view_analytics', true,
          'manage_settings', true
        ),
        updated_at = now()
    WHERE user_id = target_user_id;
    
    RETURN 'Utilisateur promu en Super Admin (mise à jour)';
  ELSE
    -- Créer un nouvel enregistrement admin
    INSERT INTO admin_users (
      user_id,
      role,
      is_active,
      permissions,
      assigned_at
    ) VALUES (
      target_user_id,
      'super_admin',
      true,
      jsonb_build_object(
        'manage_users', true,
        'manage_admins', true,
        'manage_content', true,
        'manage_finances', true,
        'view_analytics', true,
        'manage_settings', true
      ),
      now()
    );
    
    RETURN 'Utilisateur promu en Super Admin (nouveau)';
  END IF;
END;
$$;