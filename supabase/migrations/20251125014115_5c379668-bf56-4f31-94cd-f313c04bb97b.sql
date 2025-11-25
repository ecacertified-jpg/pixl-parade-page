-- Fix the audit log trigger to handle foreign key constraint properly
CREATE OR REPLACE FUNCTION public.log_platform_setting_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  -- Try to get admin_user_id from NEW.last_modified_by first (set by the app)
  v_admin_user_id := NEW.last_modified_by;
  
  -- If not set, try to find from auth.uid()
  IF v_admin_user_id IS NULL THEN
    SELECT id INTO v_admin_user_id
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
    LIMIT 1;
  END IF;

  -- Only insert audit log if we have a valid admin_user_id
  IF v_admin_user_id IS NOT NULL THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block the update
      RAISE WARNING 'Failed to create audit log: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;