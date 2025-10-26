-- Supprimer la contrainte UNIQUE sur user_id pour permettre plusieurs business par utilisateur
ALTER TABLE business_accounts DROP CONSTRAINT IF EXISTS business_accounts_user_id_key;

-- Ajouter un index pour maintenir les performances de requête
CREATE INDEX IF NOT EXISTS idx_business_accounts_user_id ON business_accounts(user_id);