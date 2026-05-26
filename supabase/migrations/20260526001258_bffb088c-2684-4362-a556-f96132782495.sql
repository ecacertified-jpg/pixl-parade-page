DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT user_id, first_name, last_name, avatar_url, bio, created_at, privacy_setting
FROM public.profiles
WHERE privacy_setting = 'public' AND is_suspended = false AND (is_deleted IS NULL OR is_deleted = false);
GRANT SELECT ON public.public_profiles TO anon, authenticated;