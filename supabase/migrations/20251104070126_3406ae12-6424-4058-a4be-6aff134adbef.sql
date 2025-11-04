-- Create platform settings table
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  setting_category text NOT NULL,
  description text,
  is_encrypted boolean DEFAULT false,
  last_modified_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_platform_settings_key ON public.platform_settings(setting_key);
CREATE INDEX idx_platform_settings_category ON public.platform_settings(setting_category);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only Super Admins can manage platform settings
CREATE POLICY "Super admins can view platform settings"
ON public.platform_settings FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update platform settings"
ON public.platform_settings FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert platform settings"
ON public.platform_settings FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Create trigger for updated_at (reuse existing function)
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_category, description) VALUES
  ('platform_name', '{"value": "JOIE DE VIVRE"}'::jsonb, 'general', 'Nom de la plateforme'),
  ('support_email', '{"value": "support@joiedevivre.ci"}'::jsonb, 'general', 'Email de support client'),
  ('maintenance_mode', '{"enabled": false}'::jsonb, 'general', 'Mode maintenance de la plateforme'),
  
  ('commission_rate', '{"value": 8, "unit": "percent"}'::jsonb, 'finance', 'Taux de commission sur les transactions'),
  ('free_delivery_threshold', '{"value": 25000, "currency": "XOF"}'::jsonb, 'finance', 'Seuil pour livraison gratuite'),
  
  ('email_notifications', '{"enabled": true}'::jsonb, 'notifications', 'Notifications email automatiques'),
  ('push_notifications', '{"enabled": true}'::jsonb, 'notifications', 'Notifications push'),
  
  ('require_2fa_admins', '{"enabled": false}'::jsonb, 'security', 'Authentification à deux facteurs pour admins'),
  ('session_timeout', '{"value": 240, "unit": "minutes"}'::jsonb, 'security', 'Durée de session admin');

-- Create audit log function for settings changes
CREATE OR REPLACE FUNCTION public.log_platform_setting_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    description,
    metadata
  ) VALUES (
    (SELECT id FROM public.admin_users WHERE user_id = auth.uid()),
    'update',
    'platform_setting',
    NEW.id,
    'Modified platform setting: ' || NEW.setting_key,
    jsonb_build_object(
      'setting_key', NEW.setting_key,
      'old_value', OLD.setting_value,
      'new_value', NEW.setting_value
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_platform_setting_changes
  AFTER UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_platform_setting_change();

-- Add validation function for settings
CREATE OR REPLACE FUNCTION public.validate_platform_setting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate commission rate
  IF NEW.setting_key = 'commission_rate' THEN
    IF (NEW.setting_value->>'value')::numeric NOT BETWEEN 0 AND 100 THEN
      RAISE EXCEPTION 'Commission rate must be between 0 and 100';
    END IF;
  END IF;

  -- Validate free delivery threshold
  IF NEW.setting_key = 'free_delivery_threshold' THEN
    IF (NEW.setting_value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'Free delivery threshold must be positive';
    END IF;
  END IF;

  -- Validate session timeout
  IF NEW.setting_key = 'session_timeout' THEN
    IF (NEW.setting_value->>'value')::integer NOT BETWEEN 5 AND 1440 THEN
      RAISE EXCEPTION 'Session timeout must be between 5 and 1440 minutes';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_platform_setting_trigger
  BEFORE INSERT OR UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_platform_setting();