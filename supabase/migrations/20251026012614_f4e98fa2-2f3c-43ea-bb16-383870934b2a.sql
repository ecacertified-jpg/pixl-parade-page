-- Correction des politiques RLS pour business_accounts
-- Nettoyer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Anyone can view basic business info" ON business_accounts;
DROP POLICY IF EXISTS "Users can create their own business account" ON business_accounts;
DROP POLICY IF EXISTS "Users can delete their own business account" ON business_accounts;
DROP POLICY IF EXISTS "Users can manage their own business account" ON business_accounts;
DROP POLICY IF EXISTS "Users can update their own business account" ON business_accounts;

-- S'assurer que RLS est activé
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Les utilisateurs peuvent voir leurs propres business actifs
CREATE POLICY "Users can view their own business accounts"
  ON business_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique INSERT : Les utilisateurs peuvent créer leurs propres business
CREATE POLICY "Users can create their own business accounts"
  ON business_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : Les utilisateurs peuvent modifier leurs propres business
CREATE POLICY "Users can update their own business accounts"
  ON business_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : Les utilisateurs peuvent supprimer leurs propres business
CREATE POLICY "Users can delete their own business accounts"
  ON business_accounts
  FOR DELETE
  USING (auth.uid() = user_id);