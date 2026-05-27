
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  user_id,
  first_name,
  last_name,
  avatar_url,
  bio,
  birthday,
  created_at,
  privacy_setting
FROM public.profiles
WHERE privacy_setting = 'public'
  AND COALESCE(is_suspended, false) = false
  AND COALESCE(is_deleted, false) = false;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
