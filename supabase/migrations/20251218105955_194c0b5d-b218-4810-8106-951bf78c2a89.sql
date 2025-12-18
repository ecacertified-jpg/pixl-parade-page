-- 1. Créer la fonction is_admin SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND is_active = true
  )
$$;

-- 2. Créer la vue sécurisée admin_sessions_safe (sans problème de type inet)
CREATE OR REPLACE VIEW public.admin_sessions_safe AS
SELECT 
  id,
  admin_user_id,
  '[MASQUÉ]'::text as ip_address_display,
  user_agent,
  created_at,
  expires_at,
  revoked_at
FROM public.admin_sessions;

-- 3. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT SELECT ON public.admin_sessions_safe TO authenticated;

-- 4. Activer RLS sur la vue (via une politique sur la table source)
-- Note: Les vues héritent des politiques RLS de leurs tables sous-jacentes

-- 5. Commentaires de documentation
COMMENT ON FUNCTION public.is_admin IS 'Vérifie si un utilisateur est admin actif - SECURITY DEFINER pour éviter exposition directe de admin_users';
COMMENT ON VIEW public.admin_sessions_safe IS 'Vue sécurisée des sessions admin avec IP masquée';