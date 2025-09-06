-- Créer un trigger pour gérer automatiquement l'achèvement des cagnottes et la création des commandes business

-- Fonction pour traiter l'achèvement des cagnottes
CREATE OR REPLACE FUNCTION public.handle_fund_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_record RECORD;
  business_record RECORD;
BEGIN
  -- Récupérer les informations de la cagnotte
  SELECT * INTO fund_record
  FROM public.collective_funds
  WHERE id = NEW.fund_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si l'objectif est maintenant atteint
  IF fund_record.current_amount >= fund_record.target_amount AND fund_record.status = 'active' THEN
    -- Mettre à jour le statut de la cagnotte
    UPDATE public.collective_funds
    SET status = 'target_reached'
    WHERE id = fund_record.id;
    
    -- Créer une notification pour le créateur
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods
    ) VALUES (
      fund_record.creator_id,
      'fund_completed',
      'Objectif atteint ! 🎉',
      'Votre cagnotte "' || fund_record.title || '" a atteint son objectif. La commande va être traitée.',
      now(),
      ARRAY['email', 'push', 'in_app']
    );
    
    -- Récupérer les détails de la commande collective existante
    SELECT * INTO business_record
    FROM public.collective_fund_orders cfo
    WHERE cfo.fund_id = fund_record.id
    LIMIT 1;
    
    -- Si une commande existe, créer une entrée pour les comptes business
    IF FOUND THEN
      -- Insérer la commande dans la table des commandes pour les business
      INSERT INTO public.business_orders (
        fund_id,
        business_account_id,
        order_summary,
        total_amount,
        currency,
        donor_phone,
        beneficiary_phone,
        delivery_address,
        payment_method,
        status,
        created_at
      )
      SELECT 
        business_record.fund_id,
        ba.id, -- ID du compte business
        business_record.order_summary,
        business_record.total_amount,
        business_record.currency,
        business_record.donor_phone,
        business_record.beneficiary_phone,
        business_record.delivery_address,
        business_record.payment_method,
        'pending',
        now()
      FROM public.business_accounts ba
      WHERE ba.user_id = (
        -- Récupérer le business owner depuis les produits dans la commande
        SELECT DISTINCT p.business_owner_id
        FROM jsonb_array_elements(business_record.order_summary->'items') AS item
        JOIN public.products p ON p.id::text = item->>'id'
        WHERE p.business_owner_id IS NOT NULL
        LIMIT 1
      )
      AND ba.is_active = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur fund_contributions
DROP TRIGGER IF EXISTS trigger_handle_fund_completion ON public.fund_contributions;
CREATE TRIGGER trigger_handle_fund_completion
  AFTER INSERT ON public.fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_fund_completion();

-- Créer la table business_orders si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.business_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  order_summary JSONB NOT NULL DEFAULT '{}',
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  donor_phone TEXT NOT NULL,
  beneficiary_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur business_orders
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour business_orders
CREATE POLICY "Business owners can view their orders"
ON public.business_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_orders.business_account_id
    AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update their orders"
ON public.business_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_orders.business_account_id
    AND ba.user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_business_orders_updated_at
  BEFORE UPDATE ON public.business_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();