-- Option 2: Créer la relation d'amitié entre Eca et Florentin
INSERT INTO contact_relationships (user_a, user_b, can_see_funds, relationship_type)
VALUES (
  '18190696-a87e-4c74-a8c8-a9968884e1cb', -- Eca
  '3fc4a030-46ca-44f7-92d8-eb2d70e1610e', -- Florentin
  true,
  'friend'
)
ON CONFLICT DO NOTHING;

-- Option 1: Ajouter le numéro de téléphone à Florentin
UPDATE profiles
SET phone = '+2250546566646'
WHERE user_id = '3fc4a030-46ca-44f7-92d8-eb2d70e1610e';

-- Établir d'autres relations d'amitié utiles entre les utilisateurs existants
-- (Si vous avez d'autres utilisateurs spécifiques à connecter, je peux les ajouter)