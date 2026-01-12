-- Définir les valeurs par défaut pour auto-approbation
ALTER TABLE business_accounts 
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN status SET DEFAULT 'active';

-- Migrer tous les comptes en attente vers actif
UPDATE business_accounts 
SET 
  status = 'active',
  is_active = true
WHERE status IN ('pending', 'resubmitted');