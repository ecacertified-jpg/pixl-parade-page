-- Ajouter une politique RLS permettant à tous les utilisateurs authentifiés de voir les boutiques actives
CREATE POLICY "Authenticated users can view active businesses"
ON business_accounts FOR SELECT
USING (is_active = true);