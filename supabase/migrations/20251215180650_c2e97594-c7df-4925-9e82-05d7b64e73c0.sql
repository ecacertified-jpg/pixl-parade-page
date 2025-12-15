-- Fix all views to use security_invoker = true
-- This ensures views respect RLS of the querying user, not the view creator

-- 1. Fix business_public_info view
DROP VIEW IF EXISTS business_public_info;
CREATE VIEW business_public_info 
WITH (security_invoker = true) AS
SELECT id,
    business_name,
    business_type,
    description,
    logo_url,
    is_active,
    is_verified,
    status,
    opening_hours,
    delivery_zones,
    delivery_settings,
    created_at
FROM business_accounts
WHERE is_active = true;

GRANT SELECT ON business_public_info TO authenticated;
GRANT SELECT ON business_public_info TO anon;

-- 2. Fix contacts_limited view
DROP VIEW IF EXISTS contacts_limited;
CREATE VIEW contacts_limited 
WITH (security_invoker = true) AS
SELECT id,
    name,
    birthday,
    user_id
FROM contacts;

GRANT SELECT ON contacts_limited TO authenticated;

-- 3. Fix product_rating_stats view
DROP VIEW IF EXISTS product_rating_stats;
CREATE VIEW product_rating_stats 
WITH (security_invoker = true) AS
SELECT product_id,
    count(*) AS rating_count,
    round(avg(rating), 1) AS average_rating,
    count(CASE WHEN (rating = 5) THEN 1 ELSE NULL END) AS five_star_count,
    count(CASE WHEN (rating = 4) THEN 1 ELSE NULL END) AS four_star_count,
    count(CASE WHEN (rating = 3) THEN 1 ELSE NULL END) AS three_star_count,
    count(CASE WHEN (rating = 2) THEN 1 ELSE NULL END) AS two_star_count,
    count(CASE WHEN (rating = 1) THEN 1 ELSE NULL END) AS one_star_count
FROM product_ratings
GROUP BY product_id;

GRANT SELECT ON product_rating_stats TO authenticated;
GRANT SELECT ON product_rating_stats TO anon;

-- 4. Fix user_badges_with_definitions view
DROP VIEW IF EXISTS user_badges_with_definitions;
CREATE VIEW user_badges_with_definitions 
WITH (security_invoker = true) AS
SELECT ub.id,
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
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_key = bd.badge_key
WHERE bd.is_active = true;

GRANT SELECT ON user_badges_with_definitions TO authenticated;

-- 5. Fix user_birthday_stats view
DROP VIEW IF EXISTS user_birthday_stats;
CREATE VIEW user_birthday_stats 
WITH (security_invoker = true) AS
SELECT p.id AS user_id,
    p.user_id AS auth_user_id,
    COALESCE(((p.first_name || ' '::text) || p.last_name), p.first_name, 'Utilisateur'::text) AS user_name,
    p.birthday_badge_level,
    p.total_birthdays_celebrated,
    p.first_birthday_on_platform,
    calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0)) AS badge_level,
    get_badge_name(calculate_birthday_badge_level(COALESCE(p.total_birthdays_celebrated, 0))) AS badge_name,
    count(bc.id) AS celebrations_count,
    array_agg(bc.celebration_year ORDER BY bc.celebration_year DESC) FILTER (WHERE bc.celebration_year IS NOT NULL) AS years_celebrated
FROM profiles p
LEFT JOIN birthday_celebrations bc ON bc.user_id = p.user_id
GROUP BY p.id, p.user_id, p.first_name, p.last_name, p.birthday_badge_level, p.total_birthdays_celebrated, p.first_birthday_on_platform;

GRANT SELECT ON user_birthday_stats TO authenticated;