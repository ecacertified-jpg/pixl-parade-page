-- Cagnotte de test pour valider le flux notification prestataire
INSERT INTO collective_funds (id, title, target_amount, current_amount, currency, status, occasion, creator_id, is_public, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Montre casio pour Françoise TEST',
  15000, 15000, 'XOF', 'target_reached', 'anniversaire',
  'e19c4519-9d98-431c-8772-60ecfcf13c43',
  true,
  NOW()
);

-- Lien vers le commerce ABIDJAN CHIC et le produit Montre casio
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a8a39b9f-530b-4cf9-8c78-8ec93e2370de',
  '7b4dc070-08a6-49f4-ae84-c0e33e65d785',
  'b3427608-b28e-4265-af53-81d63e8b4598'
);