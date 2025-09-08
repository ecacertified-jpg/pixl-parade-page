-- Créer des relations de test pour permettre les contributions
-- Insérer des profils de test si ils n'existent pas déjà
INSERT INTO public.profiles (user_id, first_name, last_name, phone)
SELECT 
  auth.users.id,
  COALESCE(auth.users.raw_user_meta_data->>'first_name', 'Utilisateur'),
  COALESCE(auth.users.raw_user_meta_data->>'last_name', 'Test'),
  COALESCE(auth.users.phone, '+225 07 00 00 00')
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.users.id
);

-- Créer des relations d'amitié entre tous les utilisateurs existants pour les tests
INSERT INTO public.contact_relationships (user_a, user_b, relationship_type, can_see_funds)
SELECT 
  LEAST(u1.id, u2.id) as user_a,
  GREATEST(u1.id, u2.id) as user_b,
  'friend' as relationship_type,
  true as can_see_funds
FROM auth.users u1
CROSS JOIN auth.users u2
WHERE u1.id != u2.id
ON CONFLICT (user_a, user_b) 
DO UPDATE SET 
  can_see_funds = true,
  updated_at = now();

-- Ajouter des contacts de test pour chaque utilisateur
INSERT INTO public.contacts (user_id, name, relationship, birthday, phone)
SELECT 
  u.id as user_id,
  p_other.first_name || ' ' || p_other.last_name as name,
  'Ami' as relationship,
  (CURRENT_DATE + INTERVAL '30 days')::date as birthday,
  p_other.phone
FROM auth.users u
CROSS JOIN public.profiles p_other
WHERE u.id != p_other.user_id
ON CONFLICT DO NOTHING;