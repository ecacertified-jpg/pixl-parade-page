-- Permettre fund_id NULL pour les messages de gratitude autonomes
ALTER TABLE public.gratitude_wall 
ALTER COLUMN fund_id DROP NOT NULL;

-- Ajouter un index pour améliorer les performances des requêtes avec fund_id NULL
CREATE INDEX IF NOT EXISTS idx_gratitude_wall_null_fund 
ON public.gratitude_wall (beneficiary_id, created_at) 
WHERE fund_id IS NULL;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.gratitude_wall.fund_id IS 
'ID de la cagnotte associée. NULL pour les messages de gratitude autonomes envoyés directement sans cagnotte.';