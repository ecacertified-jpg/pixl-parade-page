-- Create table to store pending business registrations awaiting email verification
CREATE TABLE public.pending_business_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.pending_business_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pending registration
CREATE POLICY "Users can view own pending registration"
ON public.pending_business_registrations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own pending registration
CREATE POLICY "Users can insert own pending registration"
ON public.pending_business_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pending registration
CREATE POLICY "Users can delete own pending registration"
ON public.pending_business_registrations
FOR DELETE
USING (auth.uid() = user_id);

-- Function to process pending business registration after email verification
CREATE OR REPLACE FUNCTION public.process_pending_business_registration(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pending_reg RECORD;
  new_business_id UUID;
BEGIN
  -- Get pending registration
  SELECT * INTO pending_reg
  FROM public.pending_business_registrations
  WHERE user_id = p_user_id
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Check if business account already exists
  IF EXISTS (SELECT 1 FROM public.business_accounts WHERE user_id = p_user_id) THEN
    -- Clean up pending registration
    DELETE FROM public.pending_business_registrations WHERE user_id = p_user_id;
    RETURN NULL;
  END IF;
  
  -- Create business account
  INSERT INTO public.business_accounts (
    user_id,
    business_name,
    business_type,
    phone,
    address,
    description,
    email,
    is_active,
    status
  ) VALUES (
    p_user_id,
    pending_reg.business_name,
    pending_reg.business_type,
    pending_reg.phone,
    pending_reg.address,
    pending_reg.description,
    pending_reg.email,
    false,
    'pending'
  ) RETURNING id INTO new_business_id;
  
  -- Notify admins about new business registration
  INSERT INTO public.scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  )
  SELECT 
    au.user_id,
    'new_business_pending_approval',
    '🏪 Nouveau prestataire en attente',
    pending_reg.business_name || ' vient de confirmer son email et attend votre approbation',
    now(),
    ARRAY['push', 'in_app'],
    jsonb_build_object(
      'business_name', pending_reg.business_name,
      'business_type', pending_reg.business_type,
      'business_id', new_business_id,
      'action_url', '/admin/businesses'
    )
  FROM public.admin_users au
  WHERE au.is_active = true;
  
  -- Clean up pending registration
  DELETE FROM public.pending_business_registrations WHERE user_id = p_user_id;
  
  RETURN new_business_id;
END;
$$;

-- Function to clean up expired pending registrations (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_registrations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pending_business_registrations
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;