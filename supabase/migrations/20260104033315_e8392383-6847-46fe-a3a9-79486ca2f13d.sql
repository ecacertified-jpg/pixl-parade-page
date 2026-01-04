-- Ajouter les badges du cercle d'amis
INSERT INTO public.badge_definitions 
(badge_key, category, name, description, icon, level, requirement_type, requirement_threshold, color_primary, color_secondary) 
VALUES
('first_circle', 'community', 'Premier Cercle', 'A complété son cercle d''amis initial avec 2 proches', '🤝', 1, 'count', 2, '#7A5DC7', '#C084FC'),
('growing_circle', 'community', 'Cercle en Croissance', 'A élargi son cercle à 5 amis', '🌱', 2, 'count', 5, '#22C55E', '#4ADE80')
ON CONFLICT (badge_key) DO NOTHING;