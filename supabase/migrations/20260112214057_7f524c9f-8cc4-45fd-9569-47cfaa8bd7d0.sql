-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(user_id) ON DELETE CASCADE, -- NULL = tous les admins
  type TEXT NOT NULL, -- 'new_client', 'new_business', 'new_order', 'refund_request'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_url TEXT,
  entity_type TEXT, -- 'user', 'business', 'order'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_admin_user_id ON admin_notifications(admin_user_id);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is active admin
CREATE OR REPLACE FUNCTION public.is_active_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: Admins can view all notifications (NULL admin_user_id) or their own
CREATE POLICY "Admins can view admin notifications"
ON admin_notifications FOR SELECT
USING (
  is_active_admin(auth.uid()) AND 
  (admin_user_id IS NULL OR admin_user_id = auth.uid())
);

CREATE POLICY "Admins can update admin notifications"
ON admin_notifications FOR UPDATE
USING (
  is_active_admin(auth.uid()) AND 
  (admin_user_id IS NULL OR admin_user_id = auth.uid())
);

CREATE POLICY "Admins can delete admin notifications"
ON admin_notifications FOR DELETE
USING (
  is_active_admin(auth.uid()) AND 
  (admin_user_id IS NULL OR admin_user_id = auth.uid())
);

-- Trigger function for new clients
CREATE OR REPLACE FUNCTION notify_admin_new_client()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, entity_type, entity_id, action_url, metadata, severity)
  VALUES (
    'new_client',
    'Nouveau client inscrit',
    COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' vient de s''inscrire',
    'user',
    NEW.user_id,
    '/admin/users',
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'avatar_url', NEW.avatar_url
    ),
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new clients
CREATE TRIGGER trigger_notify_admin_new_client
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_client();

-- Trigger function for new business accounts
CREATE OR REPLACE FUNCTION notify_admin_new_business()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, entity_type, entity_id, action_url, metadata, severity)
  VALUES (
    'new_business',
    'Nouvelle demande de prestataire',
    NEW.business_name || ' demande à devenir prestataire',
    'business',
    NEW.id,
    '/admin/businesses',
    jsonb_build_object(
      'business_name', NEW.business_name,
      'business_type', NEW.business_type,
      'email', NEW.email,
      'logo_url', NEW.logo_url
    ),
    'warning'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new business accounts
CREATE TRIGGER trigger_notify_admin_new_business
AFTER INSERT ON business_accounts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_business();

-- Trigger function for new orders
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER AS $$
DECLARE
  business_name_var TEXT;
BEGIN
  -- Get business name
  SELECT business_name INTO business_name_var
  FROM business_accounts
  WHERE id = NEW.business_account_id;
  
  INSERT INTO admin_notifications (type, title, message, entity_type, entity_id, action_url, metadata, severity)
  VALUES (
    'new_order',
    'Nouvelle commande',
    'Commande de ' || NEW.total_amount || ' ' || NEW.currency || ' chez ' || COALESCE(business_name_var, 'Prestataire'),
    'order',
    NEW.id,
    '/admin/orders',
    jsonb_build_object(
      'total_amount', NEW.total_amount,
      'currency', NEW.currency,
      'business_name', business_name_var,
      'status', NEW.status
    ),
    CASE WHEN NEW.total_amount > 50000 THEN 'warning' ELSE 'info' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new orders
CREATE TRIGGER trigger_notify_admin_new_order
AFTER INSERT ON business_orders
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_order();

-- Trigger function for refund requests
CREATE OR REPLACE FUNCTION notify_admin_refund_request()
RETURNS TRIGGER AS $$
DECLARE
  business_name_var TEXT;
BEGIN
  -- Only trigger when status changes to refund_requested
  IF NEW.status = 'refund_requested' AND (OLD.status IS NULL OR OLD.status != 'refund_requested') THEN
    SELECT business_name INTO business_name_var
    FROM business_accounts
    WHERE id = NEW.business_account_id;
    
    INSERT INTO admin_notifications (type, title, message, entity_type, entity_id, action_url, metadata, severity)
    VALUES (
      'refund_request',
      'Demande de remboursement',
      'Demande de remboursement de ' || NEW.total_amount || ' ' || NEW.currency || ' - ' || COALESCE(business_name_var, 'Prestataire'),
      'order',
      NEW.id,
      '/admin/orders',
      jsonb_build_object(
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'business_name', business_name_var,
        'refund_reason', NEW.refund_reason
      ),
      'critical'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for refund requests
CREATE TRIGGER trigger_notify_admin_refund_request
AFTER UPDATE ON business_orders
FOR EACH ROW
EXECUTE FUNCTION notify_admin_refund_request();

-- Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;