-- Fix security warnings: Add search_path to functions
-- First drop the dependent view
DROP VIEW IF EXISTS public.user_birthday_stats;

-- Then drop and recreate functions with search_path
DROP FUNCTION IF EXISTS public.calculate_birthday_badge_level(INTEGER);
DROP FUNCTION IF EXISTS public.get_badge_name(TEXT);

-- Fonction pour calculer le niveau de badge selon le nombre d'anniversaires (avec search_path)
CREATE OR REPLACE FUNCTION public.calculate_birthday_badge_level(celebrations_count INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE 
    WHEN celebrations_count >= 10 THEN RETURN 'diamond';
    WHEN celebrations_count >= 5 THEN RETURN 'platinum';
    WHEN celebrations_count >= 3 THEN RETURN 'gold';
    WHEN celebrations_count >= 2 THEN RETURN 'silver';
    WHEN celebrations_count >= 1 THEN RETURN 'bronze';
    ELSE RETURN 'none';
  END CASE;
END;
$$;

-- Fonction pour obtenir le nom du badge en français (avec search_path)
CREATE OR REPLACE FUNCTION public.get_badge_name(badge_level TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE badge_level
    WHEN 'diamond' THEN RETURN '💎 Diamant';
    WHEN 'platinum' THEN RETURN '⭐ Platine';
    WHEN 'gold' THEN RETURN '🏆 Or';
    WHEN 'silver' THEN RETURN '🥈 Argent';
    WHEN 'bronze' THEN RETURN '🥉 Bronze';
    ELSE RETURN '🎂 Nouveau';
  END CASE;
END;
$$;

-- Recreate the view
CREATE OR REPLACE VIEW public.user_birthday_stats AS
SELECT 
  p.id as user_id,
  p.user_id as auth_user_id,
  COALESCE(p.first_name || ' ' || p.last_name, p.first_name, 'Utilisateur') as user_name,
  p.birthday_badge_level,
  p.total_birthdays_celebrated,
  p.first_birthday_on_platform,
  calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0)) as badge_level,
  get_badge_name(calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0))) as badge_name,
  COUNT(bc.id) as celebrations_count,
  ARRAY_AGG(bc.celebration_year ORDER BY bc.celebration_year DESC) FILTER (WHERE bc.celebration_year IS NOT NULL) as years_celebrated
FROM public.profiles p
LEFT JOIN public.birthday_celebrations bc ON bc.user_id = p.user_id
GROUP BY p.id, p.user_id, p.first_name, p.last_name, p.birthday_badge_level, p.total_birthdays_celebrated, p.first_birthday_on_platform;

-- Grant access to the view
GRANT SELECT ON public.user_birthday_stats TO authenticated;