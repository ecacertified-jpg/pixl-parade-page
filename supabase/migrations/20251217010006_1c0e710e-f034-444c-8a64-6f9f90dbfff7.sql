-- Fonction pour récupérer un profil utilisateur en respectant la confidentialité
CREATE OR REPLACE FUNCTION get_user_profile_with_privacy(
  p_viewer_id uuid,
  p_target_user_id uuid
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  bio text,
  avatar_url text,
  city text,
  is_visible boolean,
  privacy_setting text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.first_name
      ELSE NULL
    END as first_name,
    CASE 
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.last_name
      ELSE NULL
    END as last_name,
    CASE 
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.bio
      ELSE NULL
    END as bio,
    CASE 
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    CASE 
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.city
      ELSE NULL
    END as city,
    public.can_view_profile(p_viewer_id, p.user_id) as is_visible,
    p.privacy_setting
  FROM profiles p
  WHERE p.user_id = p_target_user_id
  AND p.is_suspended = false;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_user_profile_with_privacy(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_with_privacy(uuid, uuid) TO anon;