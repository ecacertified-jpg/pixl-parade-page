-- Security fixes migration

-- 1. Create missing profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  birth_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Fix function search paths for all existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name)
  VALUES (NEW.id, NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Fix all other functions with proper search_path
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key_id text DEFAULT 'user_data'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := COALESCE(
    current_setting('app.encryption_key_' || key_id, true),
    current_setting('app.encryption_key', true),
    'temp_fallback_key_change_immediately'
  );

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Missing encryption key for %; configure app.encryption_key[_%]', key_id, key_id;
  END IF;

  RETURN encode(
    encrypt(
      data::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key_id text DEFAULT 'user_data'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := COALESCE(
    current_setting('app.encryption_key_' || key_id, true),
    current_setting('app.encryption_key', true),
    'temp_fallback_key_change_immediately'
  );
  
  RETURN convert_from(
    decrypt(
      decode(encrypted_data, 'base64'), 
      encryption_key::bytea, 
      'aes'
    ), 
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 4. Create security audit table for monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- 5. Add rate limiting table for form submissions
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  form_type TEXT NOT NULL,
  ip_address INET,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT true
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own form submissions" 
ON public.form_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 6. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_audit(
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource,
    ip_address,
    user_agent,
    success,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_ip_address,
    p_user_agent,
    p_success,
    p_details
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- 7. Update admin user policies to be more restrictive
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Only super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'super_admin' 
    AND au.is_active = true
    AND au.locked_until IS NULL
  )
);

-- 8. Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers to key tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();