-- Fix infinite recursion in admin_users RLS policy
-- First, create a security definer function to safely check admin roles
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid 
    AND role = 'super_admin' 
    AND is_active = true
  );
END;
$$;

-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;

-- Create a new safe RLS policy using the security definer function
CREATE POLICY "Super admins can manage admin users" 
ON public.admin_users
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Add RLS policy for user_beneficiary_history to ensure data privacy
DROP POLICY IF EXISTS "Users can update their own beneficiary history" ON public.user_beneficiary_history;
CREATE POLICY "Users can update their own beneficiary history" 
ON public.user_beneficiary_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add RLS policy for missing DELETE on user_beneficiary_history
CREATE POLICY "Users can delete their own beneficiary history" 
ON public.user_beneficiary_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure security_events table has proper INSERT policy for system logging
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true); -- This allows system functions to log security events

-- Add missing RLS policies for performance_metrics UPDATE/DELETE
CREATE POLICY "Users can update their own performance metrics" 
ON public.performance_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance metrics" 
ON public.performance_metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Strengthen existing policies by ensuring proper user validation
-- Update contact_requests to prevent spam
DROP POLICY IF EXISTS "Users can create contact requests" ON public.contact_requests;
CREATE POLICY "Users can create contact requests" 
ON public.contact_requests 
FOR INSERT 
WITH CHECK (
  auth.uid() = requester_id 
  AND requester_id != target_id -- Prevent self-requests
  AND NOT EXISTS ( -- Prevent duplicate pending requests
    SELECT 1 FROM public.contact_requests 
    WHERE requester_id = auth.uid() 
    AND target_id = contact_requests.target_id 
    AND status = 'pending' 
    AND expires_at > now()
  )
);

-- Add proper input validation trigger for sensitive data
CREATE OR REPLACE FUNCTION public.validate_sensitive_inputs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate phone numbers (basic format check)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\+]?[0-9\s\-\(\)]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to contacts table
DROP TRIGGER IF EXISTS validate_contacts_input ON public.contacts;
CREATE TRIGGER validate_contacts_input
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.validate_sensitive_inputs();

-- Apply validation trigger to profiles table
DROP TRIGGER IF EXISTS validate_profiles_input ON public.profiles;
CREATE TRIGGER validate_profiles_input
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_sensitive_inputs();

-- Create function to log security events safely
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log admin table access
  PERFORM public.log_security_event(
    'admin_table_access',
    auth.uid(),
    null,
    inet_client_addr(),
    null,
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP),
    'medium'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit trigger for admin_users table
DROP TRIGGER IF EXISTS audit_admin_users ON public.admin_users;
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();