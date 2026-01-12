-- Supprimer l'ancienne contrainte CHECK sur le statut
ALTER TABLE business_accounts 
  DROP CONSTRAINT IF EXISTS business_accounts_status_check;

-- Créer la nouvelle contrainte avec 'deleted' comme valeur autorisée
ALTER TABLE business_accounts 
  ADD CONSTRAINT business_accounts_status_check 
  CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'approved'::text, 
    'active'::text, 
    'rejected'::text, 
    'resubmitted'::text,
    'deleted'::text
  ]));