-- Reconfigurer la vue public_profiles pour contourner le RLS
-- Cela permet d'afficher les prénoms des clients dans les avis

-- Supprimer la vue actuelle
DROP VIEW IF EXISTS public_profiles;

-- Recréer avec security_invoker = false (SECURITY DEFINER)
-- Seuls les profils publics et non-suspendus sont visibles
CREATE VIEW public_profiles 
WITH (security_invoker = false)
AS
SELECT 
  user_id,
  first_name,
  avatar_url,
  bio,
  created_at,
  privacy_setting
FROM profiles
WHERE privacy_setting = 'public' AND is_suspended = false;

-- Accorder les permissions à tous les utilisateurs authentifiés et anonymes
GRANT SELECT ON public_profiles TO authenticated, anon;

-- Documentation
COMMENT ON VIEW public_profiles IS 
'Vue publique des profils. Contourne le RLS pour permettre aux utilisateurs de voir les noms dans les avis. 
N''expose que les données non-sensibles des profils publics et non-suspendus.';