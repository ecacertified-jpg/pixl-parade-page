-- Fix: Drop and recreate promote_to_super_admin functions with caller guards
-- Then revoke public execute

-- Drop existing functions
DROP FUNCTION IF EXISTS public.promote_to_super_admin(TEXT);
DROP FUNCTION IF EXISTS public.promote_to_super_admin_by_phone(TEXT, TEXT, TEXT);

-- Recreate with caller guard
CREATE FUNCTION public.promote_to_super_admin(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: only active super admins can promote users';
  END IF;

  UPDATE admin_users
  SET role = 'super_admin', updated_at = now()
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = admin_email LIMIT 1
  );
END;
$$;

CREATE FUNCTION public.promote_to_super_admin_by_phone(p_phone TEXT, p_email TEXT, p_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: only active super admins can promote users';
  END IF;

  UPDATE admin_users
  SET role = 'super_admin', updated_at = now()
  WHERE user_id = (
    SELECT id FROM auth.users WHERE phone = p_phone LIMIT 1
  );
END;
$$;

-- Revoke execute from all public roles
REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin_by_phone(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
