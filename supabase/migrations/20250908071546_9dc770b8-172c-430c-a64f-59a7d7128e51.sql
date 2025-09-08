-- Créer des relations de test simples pour permettre les contributions
-- Insérer des profils de base si manquants
INSERT INTO public.profiles (user_id, first_name, last_name, phone)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', 'Utilisateur'),
  COALESCE(u.raw_user_meta_data->>'last_name', 'Test'),
  '+225 07 00 00 00'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- Créer des relations d'amitié entre utilisateurs différents (éviter les doublons)
WITH user_pairs AS (
  SELECT DISTINCT
    LEAST(u1.id, u2.id) as user_a,
    GREATEST(u1.id, u2.id) as user_b
  FROM auth.users u1, auth.users u2
  WHERE u1.id != u2.id
)
INSERT INTO public.contact_relationships (user_a, user_b, relationship_type, can_see_funds)
SELECT user_a, user_b, 'friend', true
FROM user_pairs
ON CONFLICT (user_a, user_b) DO UPDATE SET can_see_funds = true;