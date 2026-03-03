
CREATE OR REPLACE FUNCTION public.handle_fund_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_record RECORD;
BEGIN
  -- Vérifier si l'objectif est maintenant atteint (NEW est déjà la ligne collective_funds)
  IF NEW.current_amount >= NEW.target_amount AND NEW.status = 'active' THEN
    -- Mettre à jour le statut de la cagnotte
    UPDATE public.collective_funds
    SET status = 'target_reached'
    WHERE id = NEW.id;
    
    -- Créer une notification pour le créateur
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods
    ) VALUES (
      NEW.creator_id,
      'fund_completed',
      'Objectif atteint ! 🎉',
      'Votre cagnotte "' || NEW.title || '" a atteint son objectif. La commande va être traitée.',
      now(),
      ARRAY['email', 'push', 'in_app']
    );
    
    -- Récupérer les détails de la commande collective existante
    SELECT * INTO business_record
    FROM public.collective_fund_orders cfo
    WHERE cfo.fund_id = NEW.id
    LIMIT 1;
    
    -- Si une commande existe, créer une entrée pour les comptes business
    IF FOUND THEN
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
        NEW.id,
        ba.id,
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
