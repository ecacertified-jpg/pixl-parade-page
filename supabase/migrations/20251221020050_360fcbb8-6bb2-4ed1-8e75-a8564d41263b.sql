-- Ajouter les colonnes pour la confirmation de réception et notation
ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ;
ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5);
ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ;

-- Mettre à jour la contrainte de statut pour inclure les nouveaux statuts
-- D'abord vérifier si une contrainte existe et la supprimer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'business_orders' AND constraint_name LIKE '%status%'
    ) THEN
        ALTER TABLE business_orders DROP CONSTRAINT IF EXISTS business_orders_status_check;
    END IF;
END $$;

-- Note: Les statuts possibles sont maintenant:
-- 'pending', 'processing', 'delivered', 'receipt_confirmed', 'refund_requested', 'refunded', 'cancelled'

-- Ajouter un index pour les recherches par statut client
CREATE INDEX IF NOT EXISTS idx_business_orders_customer_confirmed 
ON business_orders(customer_id, status, customer_confirmed_at);

-- Commentaires
COMMENT ON COLUMN business_orders.customer_confirmed_at IS 'Date de confirmation de réception par le client';
COMMENT ON COLUMN business_orders.customer_rating IS 'Note donnée par le client (1-5 étoiles)';
COMMENT ON COLUMN business_orders.refund_reason IS 'Raison de la demande de remboursement';
COMMENT ON COLUMN business_orders.refund_requested_at IS 'Date de la demande de remboursement';