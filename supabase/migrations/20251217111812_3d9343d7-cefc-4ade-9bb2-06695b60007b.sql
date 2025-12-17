
-- Fix 1: Update public_profiles view to use SECURITY INVOKER
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Fix 2: Add search_path to log_platform_setting_change function
CREATE OR REPLACE FUNCTION public.log_platform_setting_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix 3: Add search_path to update_product_rating_updated_at function
CREATE OR REPLACE FUNCTION public.update_product_rating_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix 4: Add search_path to update_reciprocity_imbalance_alerts_updated_at function
CREATE OR REPLACE FUNCTION public.update_reciprocity_imbalance_alerts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix 5: Move pg_net extension to extensions schema
-- First, ensure the extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the extension (this requires dropping and recreating)
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
