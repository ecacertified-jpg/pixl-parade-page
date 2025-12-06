-- Fonction pour promouvoir un utilisateur (inscrit par téléphone) en Super Admin
-- et lui ajouter des identifiants email/mot de passe pour la connexion admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin_by_phone(
  phone_number TEXT,
  admin_email TEXT,
  admin_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  admin_exists BOOLEAN;
  clean_phone TEXT;
BEGIN
  -- Nettoyer le numéro de téléphone (enlever le +)
  clean_phone := REPLACE(phone_number, '+', '');
  
  -- Trouver l'utilisateur par téléphone
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE phone = clean_phone OR phone = phone_number;
  
  IF target_user_id IS NULL THEN
    RETURN 'Erreur: Aucun utilisateur trouvé avec ce numéro de téléphone';
  END IF;
  
  -- Vérifier que l'email n'est pas déjà utilisé
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email AND id != target_user_id) THEN
    RETURN 'Erreur: Cet email est déjà utilisé par un autre compte';
  END IF;
  
  -- Ajouter email et mot de passe à l'utilisateur
  UPDATE auth.users
  SET 
    email = admin_email,
    encrypted_password = crypt(admin_password, gen_salt('bf')),
    email_confirmed_at = now(),
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', admin_email, 'email_verified', true),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Vérifier si déjà admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = target_user_id
  ) INTO admin_exists;
  
  IF admin_exists THEN
    -- Mettre à jour en super_admin
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
    
    RETURN 'Succès: Email/mot de passe ajoutés et utilisateur promu Super Admin (mise à jour)';
  ELSE
    -- Créer nouvel enregistrement admin
    INSERT INTO admin_users (
      user_id, role, is_active, permissions, assigned_at
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
    
    RETURN 'Succès: Email/mot de passe ajoutés et utilisateur promu Super Admin (nouveau)';
  END IF;
END;
$$;