-- =====================================================
-- FIX: Security Definer Views
-- Recreate views with SECURITY INVOKER (default)
-- This ensures RLS policies are applied based on querying user
-- =====================================================

-- 1. Drop and recreate contacts_limited view
DROP VIEW IF EXISTS public.contacts_limited;
CREATE VIEW public.contacts_limited AS
SELECT 
  id,
  name,
  birthday,
  user_id
FROM public.contacts c;

-- 2. Drop and recreate product_rating_stats view
DROP VIEW IF EXISTS public.product_rating_stats;
CREATE VIEW public.product_rating_stats AS
SELECT 
  product_id,
  count(*) AS rating_count,
  round(avg(rating), 1) AS average_rating,
  count(CASE WHEN (rating = 5) THEN 1 ELSE NULL::integer END) AS five_star_count,
  count(CASE WHEN (rating = 4) THEN 1 ELSE NULL::integer END) AS four_star_count,
  count(CASE WHEN (rating = 3) THEN 1 ELSE NULL::integer END) AS three_star_count,
  count(CASE WHEN (rating = 2) THEN 1 ELSE NULL::integer END) AS two_star_count,
  count(CASE WHEN (rating = 1) THEN 1 ELSE NULL::integer END) AS one_star_count
FROM public.product_ratings
GROUP BY product_id;

-- 3. Drop and recreate user_badges_with_definitions view
DROP VIEW IF EXISTS public.user_badges_with_definitions;
CREATE VIEW public.user_badges_with_definitions AS
SELECT 
  ub.id,
  ub.user_id,
  ub.badge_key,
  ub.earned_at,
  ub.progress_value,
  ub.metadata,
  ub.is_showcased,
  bd.category,
  bd.name,
  bd.description,
  bd.icon,
  bd.level,
  bd.requirement_type,
  bd.requirement_threshold,
  bd.color_primary,
  bd.color_secondary
FROM public.user_badges ub
JOIN public.badge_definitions bd ON (ub.badge_key = bd.badge_key)
WHERE (bd.is_active = true);

-- 4. Drop and recreate user_birthday_stats view
DROP VIEW IF EXISTS public.user_birthday_stats;
CREATE VIEW public.user_birthday_stats AS
SELECT 
  p.id AS user_id,
  p.user_id AS auth_user_id,
  COALESCE(((p.first_name || ' '::text) || p.last_name), p.first_name, 'Utilisateur'::text) AS user_name,
  p.birthday_badge_level,
  p.total_birthdays_celebrated,
  p.first_birthday_on_platform,
  public.calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0)) AS badge_level,
  public.get_badge_name(public.calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0))) AS badge_name,
  count(bc.id) AS celebrations_count,
  array_agg(bc.celebration_year ORDER BY bc.celebration_year DESC) FILTER (WHERE (bc.celebration_year IS NOT NULL)) AS years_celebrated
FROM public.profiles p
LEFT JOIN public.birthday_celebrations bc ON (bc.user_id = p.user_id)
GROUP BY p.id, p.user_id, p.first_name, p.last_name, p.birthday_badge_level, p.total_birthdays_celebrated, p.first_birthday_on_platform;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.contacts_limited TO authenticated;
GRANT SELECT ON public.product_rating_stats TO authenticated, anon;
GRANT SELECT ON public.user_badges_with_definitions TO authenticated;
GRANT SELECT ON public.user_birthday_stats TO authenticated;