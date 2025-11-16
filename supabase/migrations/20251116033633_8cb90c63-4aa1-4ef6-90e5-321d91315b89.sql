-- Fonction pour gérer la rupture de stock automatiquement
CREATE OR REPLACE FUNCTION public.handle_out_of_stock()
RETURNS TRIGGER AS $$
DECLARE
  business_owner_id UUID;
  product_name TEXT;
BEGIN
  -- Si le stock passe à 0 et le produit est actif
  IF NEW.stock_quantity = 0 AND NEW.is_active = true THEN
    -- Désactiver automatiquement le produit
    NEW.is_active = false;
    
    -- Récupérer l'ID du propriétaire et le nom du produit
    business_owner_id := NEW.business_owner_id;
    product_name := NEW.name;
    
    -- Créer une notification pour le commerçant
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      business_owner_id,
      'stock_alert',
      '⚠️ Rupture de stock',
      'Le produit "' || product_name || '" est en rupture de stock et a été désactivé automatiquement de la boutique.',
      now(),
      ARRAY['email', 'push', 'in_app'],
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', product_name,
        'alert_type', 'out_of_stock'
      )
    );
  END IF;
  
  -- Si le stock passe en dessous d'un seuil critique (5) mais n'est pas à 0
  IF NEW.stock_quantity > 0 AND NEW.stock_quantity <= 5 AND 
     (OLD.stock_quantity IS NULL OR OLD.stock_quantity > 5) THEN
    
    business_owner_id := NEW.business_owner_id;
    product_name := NEW.name;
    
    -- Créer une alerte de stock faible
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      business_owner_id,
      'low_stock_alert',
      '📦 Stock faible',
      'Le produit "' || product_name || '" n''a plus que ' || NEW.stock_quantity || ' unités en stock.',
      now(),
      ARRAY['in_app', 'push'],
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', product_name,
        'stock_quantity', NEW.stock_quantity,
        'alert_type', 'low_stock'
      )
    );
  END IF;
  
  -- Si le stock est réapprovisionné (passe de 0 à > 0), réactiver automatiquement
  IF OLD.stock_quantity = 0 AND NEW.stock_quantity > 0 AND NEW.is_active = false THEN
    NEW.is_active = true;
    
    business_owner_id := NEW.business_owner_id;
    product_name := NEW.name;
    
    -- Notifier la réactivation
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      business_owner_id,
      'stock_replenished',
      '✅ Produit réactivé',
      'Le produit "' || product_name || '" a été réapprovisionné (' || NEW.stock_quantity || ' unités) et réactivé dans la boutique.',
      now(),
      ARRAY['in_app'],
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', product_name,
        'stock_quantity', NEW.stock_quantity,
        'alert_type', 'restocked'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur la table products
DROP TRIGGER IF EXISTS trigger_handle_out_of_stock ON public.products;
CREATE TRIGGER trigger_handle_out_of_stock
  BEFORE UPDATE OF stock_quantity, is_active ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_out_of_stock();

-- Trigger pour les nouveaux produits avec stock = 0
DROP TRIGGER IF EXISTS trigger_check_initial_stock ON public.products;
CREATE TRIGGER trigger_check_initial_stock
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_out_of_stock();