-- Drop and recreate the function with country_code
DROP FUNCTION IF EXISTS public.get_visible_profiles_for_posts(uuid, uuid[]);

CREATE OR REPLACE FUNCTION public.get_visible_profiles_for_posts(
  p_viewer_id uuid,
  p_user_ids uuid[]
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  is_visible boolean,
  country_code text
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
      WHEN public.can_view_profile(p_viewer_id, p.user_id) THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    public.can_view_profile(p_viewer_id, p.user_id) as is_visible,
    p.country_code
  FROM profiles p
  WHERE p.user_id = ANY(p_user_ids)
  AND p.is_suspended = false;
END;
$$;