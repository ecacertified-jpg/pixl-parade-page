-- Ajouter les colonnes pour le soft-delete
ALTER TABLE business_accounts 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Index pour les requêtes sur la corbeille
CREATE INDEX IF NOT EXISTS idx_business_accounts_deleted_at 
  ON business_accounts(deleted_at) WHERE deleted_at IS NOT NULL;

-- Créer une table pour archiver les données liées avant suppression
CREATE TABLE IF NOT EXISTS deleted_business_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  archived_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT now(),
  deleted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour la purge automatique
CREATE INDEX IF NOT EXISTS idx_deleted_business_archives_expires_at 
  ON deleted_business_archives(expires_at);

-- RLS pour deleted_business_archives
ALTER TABLE deleted_business_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view archives" ON deleted_business_archives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can insert archives" ON deleted_business_archives
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can delete archives" ON deleted_business_archives
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Vue pour les business supprimés avec infos admin
CREATE OR REPLACE VIEW deleted_businesses_with_admin AS
SELECT 
  ba.*,
  p.first_name as deleted_by_first_name,
  p.last_name as deleted_by_last_name,
  dba.archived_data,
  dba.expires_at,
  GREATEST(0, EXTRACT(DAY FROM (dba.expires_at - now()))) as days_remaining
FROM business_accounts ba
LEFT JOIN profiles p ON ba.deleted_by = p.user_id
LEFT JOIN deleted_business_archives dba ON ba.id = dba.business_id
WHERE ba.deleted_at IS NOT NULL;