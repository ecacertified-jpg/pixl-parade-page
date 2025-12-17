-- Supprimer la vue actuelle
DROP VIEW IF EXISTS public_profiles;

-- Recréer avec security_invoker = false (SECURITY DEFINER par défaut)
-- Cela permet à la vue de contourner le RLS car elle n'expose que des données publiques
CREATE VIEW public_profiles 
WITH (security_invoker = false)
AS
SELECT 
  user_id,
  first_name,
  last_name,
  bio,
  avatar_url,
  created_at,
  privacy_setting
FROM profiles
WHERE privacy_setting = 'public' AND is_suspended = false;

-- Accorder les permissions de lecture à tous les utilisateurs
GRANT SELECT ON public_profiles TO authenticated, anon;