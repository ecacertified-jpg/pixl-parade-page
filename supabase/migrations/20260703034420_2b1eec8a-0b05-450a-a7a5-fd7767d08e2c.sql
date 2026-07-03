
-- Ensure a profile row exists for the current auth user
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  meta jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = uid) THEN
    RETURN uid;
  END IF;

  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = uid;

  INSERT INTO public.profiles (user_id, first_name, last_name, avatar_url)
  VALUES (
    uid,
    COALESCE(meta->>'first_name', meta->>'given_name', meta->>'name', 'Utilisateur'),
    COALESCE(meta->>'last_name', meta->>'family_name', ''),
    meta->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

-- Get creator avatar for active event pages, bypassing privacy_setting
CREATE OR REPLACE FUNCTION public.get_event_page_creator_avatar(page_id uuid)
RETURNS TABLE(first_name text, last_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.first_name, p.last_name, p.avatar_url
  FROM public.event_pages ep
  JOIN public.profiles p ON p.user_id = ep.creator_id
  WHERE ep.id = page_id AND ep.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_page_creator_avatar(uuid) TO anon, authenticated;
