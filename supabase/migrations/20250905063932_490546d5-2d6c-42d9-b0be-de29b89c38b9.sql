-- Fix remaining security issues from linter

-- Fix functions with mutable search_path by adding SET search_path = public
-- Update all existing functions to have proper search_path settings

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
  RETURN NEW;
END;
$$;

-- Fix get_user_favorites_with_products function
CREATE OR REPLACE FUNCTION public.get_user_favorites_with_products(p_user_id uuid)
RETURNS TABLE(
  favorite_id uuid, 
  product_id uuid, 
  product_name text, 
  product_description text, 
  product_price numeric, 
  product_currency text, 
  product_image_url text, 
  product_category_id uuid, 
  added_at timestamp with time zone, 
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.id as favorite_id,
    p.id as product_id,
    p.name as product_name,
    p.description as product_description,
    p.price as product_price,
    p.currency as product_currency,
    p.image_url as product_image_url,
    p.category_id as product_category_id,
    uf.created_at as added_at,
    uf.notes as notes
  FROM public.user_favorites uf
  JOIN public.products p ON p.id = uf.product_id
  WHERE uf.user_id = p_user_id
  AND p.is_active = true
  ORDER BY uf.created_at DESC;
END;
$$;

-- Fix handle_failed_verification function
CREATE OR REPLACE FUNCTION public.handle_failed_verification(p_verification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verification_record RECORD;
  block_duration interval;
BEGIN
  -- Get verification record
  SELECT * INTO verification_record
  FROM public.transaction_verifications
  WHERE id = p_verification_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Increment attempt counter
  UPDATE public.transaction_verifications
  SET verification_attempts = verification_attempts + 1
  WHERE id = p_verification_id;
  
  -- Block after too many failed attempts
  IF verification_record.verification_attempts >= 2 THEN -- 3 total attempts (0,1,2)
    -- Exponential backoff: 15 min, 1 hour, 4 hours
    block_duration := CASE
      WHEN verification_record.verification_attempts = 2 THEN interval '15 minutes'
      WHEN verification_record.verification_attempts = 3 THEN interval '1 hour'
      ELSE interval '4 hours'
    END;
    
    UPDATE public.transaction_verifications
    SET blocked_until = now() + block_duration
    WHERE id = p_verification_id;
  END IF;
END;
$$;

-- Fix encrypt_instagram_token function
CREATE OR REPLACE FUNCTION public.encrypt_instagram_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.encrypt_sensitive_data(p_token, 'instagram_tokens');
END;
$$;

-- Fix decrypt_instagram_token function
CREATE OR REPLACE FUNCTION public.decrypt_instagram_token(p_encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.decrypt_sensitive_data(p_encrypted_token, 'instagram_tokens');
END;
$$;

-- Fix process_expired_funds function
CREATE OR REPLACE FUNCTION public.process_expired_funds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_fund RECORD;
  transaction_record RECORD;
BEGIN
  -- Mark expired funds
  UPDATE public.collective_funds 
  SET status = 'expired' 
  WHERE deadline_date < CURRENT_DATE 
  AND status = 'active' 
  AND current_amount < target_amount;
  
  -- Process refunds for each expired fund
  FOR expired_fund IN 
    SELECT id FROM public.collective_funds 
    WHERE status = 'expired' 
    AND NOT EXISTS (SELECT 1 FROM public.refunds WHERE fund_id = collective_funds.id)
  LOOP
    -- Create refunds for each successful transaction
    FOR transaction_record IN 
      SELECT * FROM public.payment_transactions 
      WHERE fund_id = expired_fund.id 
      AND status = 'completed'
    LOOP
      INSERT INTO public.refunds (
        fund_id, 
        transaction_id, 
        amount, 
        currency, 
        reason
      ) VALUES (
        expired_fund.id,
        transaction_record.id,
        transaction_record.amount,
        transaction_record.currency,
        'fund_expired'
      );
    END LOOP;
    
    -- Create activity for expired fund
    PERFORM public.create_fund_activity(
      expired_fund.id,
      NULL,
      'fund_expired',
      NULL,
      'Cagnotte expirée - Remboursements en cours',
      '{"auto_processed": true}'::jsonb
    );
  END LOOP;
END;
$$;

-- Remove potentially problematic views or secure them properly
-- Check if there are any SECURITY DEFINER views that need to be fixed
-- (The linter will tell us which specific views are problematic)

-- Create a secure function to check view permissions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true),
    'user'
  );
$$;