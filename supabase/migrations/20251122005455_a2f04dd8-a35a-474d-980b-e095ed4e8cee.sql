-- Fix the audit log function to handle non-admin users gracefully
CREATE OR REPLACE FUNCTION public.log_platform_setting_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  -- Get the admin_user_id for the current user
  SELECT id INTO v_admin_user_id
  FROM public.admin_users
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;

  -- Only insert audit log if the user is an admin
  IF v_admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_audit_logs (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      description,
      metadata
    ) VALUES (
      v_admin_user_id,
      'update',
      'platform_setting',
      NEW.id,
      'Modified platform setting: ' || NEW.setting_key,
      jsonb_build_object(
        'setting_key', NEW.setting_key,
        'old_value', OLD.setting_value,
        'new_value', NEW.setting_value,
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Add a comment to document the fix
COMMENT ON FUNCTION public.log_platform_setting_change() IS 
'Logs platform setting changes to audit_logs table. Only creates log entries for active admin users to prevent foreign key violations.';