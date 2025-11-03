-- Fix ERROR-level security issues - Part 2: Admin Sessions

-- Create secure function to check if user is an active admin
CREATE OR REPLACE FUNCTION public.is_active_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid
    AND is_active = true
  );
END;
$$;

-- Drop any overly permissive policies on admin_sessions
DROP POLICY IF EXISTS "System can insert admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can manage their own sessions" ON public.admin_sessions;

-- Only allow admins to create their own sessions
CREATE POLICY "Only admins can create their sessions"
ON public.admin_sessions 
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM admin_users WHERE id = admin_user_id)
  AND public.is_active_admin(auth.uid())
);

-- Admins can only select their own sessions
CREATE POLICY "Admins can view their own sessions"
ON public.admin_sessions 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = admin_sessions.admin_user_id
    AND au.user_id = auth.uid()
    AND au.is_active = true
  )
);

-- Admins can update their own sessions (for revocation)
CREATE POLICY "Admins can update their own sessions"
ON public.admin_sessions 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = admin_sessions.admin_user_id
    AND au.user_id = auth.uid()
    AND au.is_active = true
  )
);