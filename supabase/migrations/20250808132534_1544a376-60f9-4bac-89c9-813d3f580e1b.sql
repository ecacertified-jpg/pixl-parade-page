-- SECURITY HARDENING MIGRATION (retry with IF NOT EXISTS-safe policy creation)
-- 1) Create foundational tables used by security functions (if missing)

-- Rate limit buckets table
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  identifier text NOT NULL,
  bucket_type text NOT NULL,
  tokens integer NOT NULL DEFAULT 0,
  max_tokens integer NOT NULL DEFAULT 100,
  refill_rate integer NOT NULL DEFAULT 60,
  last_refill timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (identifier, bucket_type)
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: deny direct client access; used via SECURITY DEFINER function

-- Transaction verifications table
CREATE TABLE IF NOT EXISTS public.transaction_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fund_id uuid NULL,
  beneficiary_contact_id uuid NULL,
  verification_type text NOT NULL DEFAULT 'sms',
  verification_code text NOT NULL,
  verification_attempts integer NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  blocked_until timestamptz NULL,
  ip_address inet NULL,
  device_fingerprint text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_tx_verif_user ON public.transaction_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_verif_fund ON public.transaction_verifications(fund_id);
CREATE INDEX IF NOT EXISTS idx_tx_verif_expires ON public.transaction_verifications(expires_at);

ALTER TABLE public.transaction_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='transaction_verifications' AND policyname='Users can view their own verifications'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own verifications" ON public.transaction_verifications';
  END IF;
  EXECUTE 'CREATE POLICY "Users can view their own verifications" ON public.transaction_verifications FOR SELECT USING (auth.uid() = user_id)';
END$$;

-- 2) Remove overly-permissive policies and replace with least-privileged ones

-- scheduled_notifications: remove ALL access policy intended for system-only operations
DROP POLICY IF EXISTS "System can manage scheduled notifications" ON public.scheduled_notifications;
-- Leave existing "Users can view their own scheduled notifications" intact

-- performance_metrics: tighten INSERT policy (drop old, create controlled)
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.performance_metrics;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='performance_metrics' AND policyname='Users can insert their performance metrics'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their performance metrics" ON public.performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END$$;

-- security_events: prevent arbitrary client inserts; rely on SECURITY DEFINER RPC instead
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "System can insert security events for tracking" ON public.security_events;
-- Keep existing admin-only SELECT policy

-- fund_activities_secure: enable RLS and restrict to admins for read-only
ALTER TABLE public.fund_activities_secure ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='fund_activities_secure' AND policyname='Admins can view secure fund activities'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view secure fund activities" ON public.fund_activities_secure FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true))';
  END IF;
END$$;

-- 3) Fix search_path for SECURITY DEFINER functions to prevent search path attacks
-- Prefer ALTER FUNCTION (idempotent, doesn't touch bodies)

ALTER FUNCTION IF EXISTS public.prevent_unauthorized_admin_assignment() RESET ALL;
ALTER FUNCTION IF EXISTS public.prevent_unauthorized_admin_assignment() SET search_path = public;

ALTER FUNCTION IF EXISTS public.can_contribute_to_fund(uuid) RESET ALL;
ALTER FUNCTION IF EXISTS public.can_contribute_to_fund(uuid) SET search_path = public;

ALTER FUNCTION IF EXISTS public.handle_contribution_activity() RESET ALL;
ALTER FUNCTION IF EXISTS public.handle_contribution_activity() SET search_path = public;

ALTER FUNCTION IF EXISTS public.add_loyalty_points(uuid, integer, text, uuid, text) RESET ALL;
ALTER FUNCTION IF EXISTS public.add_loyalty_points(uuid, integer, text, uuid, text) SET search_path = public;

ALTER FUNCTION IF EXISTS public.spend_loyalty_points(uuid, integer, text, uuid, text) RESET ALL;
ALTER FUNCTION IF EXISTS public.spend_loyalty_points(uuid, integer, text, uuid, text) SET search_path = public;

ALTER FUNCTION IF EXISTS public.calculate_loyalty_points(text, numeric) RESET ALL;
ALTER FUNCTION IF EXISTS public.calculate_loyalty_points(text, numeric) SET search_path = public;

ALTER FUNCTION IF EXISTS public.award_points_fund_creation() RESET ALL;
ALTER FUNCTION IF EXISTS public.award_points_fund_creation() SET search_path = public;

ALTER FUNCTION IF EXISTS public.is_first_payment_to_beneficiary(uuid, uuid) RESET ALL;
ALTER FUNCTION IF EXISTS public.is_first_payment_to_beneficiary(uuid, uuid) SET search_path = public;

ALTER FUNCTION IF EXISTS public.award_points_contribution() RESET ALL;
ALTER FUNCTION IF EXISTS public.award_points_contribution() SET search_path = public;

ALTER FUNCTION IF EXISTS public.create_transaction_verification(uuid, uuid, uuid, text) RESET ALL;
ALTER FUNCTION IF EXISTS public.create_transaction_verification(uuid, uuid, uuid, text) SET search_path = public;

ALTER FUNCTION IF EXISTS public.cleanup_expired_verifications() RESET ALL;
ALTER FUNCTION IF EXISTS public.cleanup_expired_verifications() SET search_path = public;

ALTER FUNCTION IF EXISTS public.detect_suspicious_behavior() RESET ALL;
ALTER FUNCTION IF EXISTS public.detect_suspicious_behavior() SET search_path = public;

ALTER FUNCTION IF EXISTS public.generate_event_analytics() RESET ALL;
ALTER FUNCTION IF EXISTS public.generate_event_analytics() SET search_path = public;

ALTER FUNCTION IF EXISTS public.request_contact_relationship(uuid, text) RESET ALL;
ALTER FUNCTION IF EXISTS public.request_contact_relationship(uuid, text) SET search_path = public;

ALTER FUNCTION IF EXISTS public.respond_to_contact_request(uuid, boolean) RESET ALL;
ALTER FUNCTION IF EXISTS public.respond_to_contact_request(uuid, boolean) SET search_path = public;

ALTER FUNCTION IF EXISTS public.are_users_connected(uuid, uuid) RESET ALL;
ALTER FUNCTION IF EXISTS public.are_users_connected(uuid, uuid) SET search_path = public;

ALTER FUNCTION IF EXISTS public.update_updated_at_column() RESET ALL;
ALTER FUNCTION IF EXISTS public.update_updated_at_column() SET search_path = public;

ALTER FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer) RESET ALL;
ALTER FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer) SET search_path = public;

-- 4) Consolidate verification RPCs and ensure secure implementation
-- Drop legacy duplicate with weaker signature
DROP FUNCTION IF EXISTS public.create_transaction_verification_with_rate_limit(uuid, uuid, uuid, text);

-- Ensure the hardened version exists with explicit search_path and telemetry fields
CREATE OR REPLACE FUNCTION public.create_transaction_verification_with_rate_limit(
  p_user_id uuid,
  p_fund_id uuid,
  p_beneficiary_contact_id uuid,
  p_verification_type text DEFAULT 'sms',
  p_ip_address inet DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  verification_id uuid;
  verification_code text;
  user_identifier text;
  blocked_until_time timestamptz;
BEGIN
  user_identifier := COALESCE(p_user_id::text, p_ip_address::text, 'anonymous');

  SELECT blocked_until INTO blocked_until_time
  FROM public.transaction_verifications
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND blocked_until > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF blocked_until_time IS NOT NULL THEN
    RAISE EXCEPTION 'Verification blocked until %', blocked_until_time;
  END IF;

  IF NOT public.check_rate_limit(user_identifier, 'sms_verification_hourly', 3, 3) THEN
    RAISE EXCEPTION 'Hourly rate limit exceeded for SMS verification. Please wait before requesting another code.';
  END IF;

  IF NOT public.check_rate_limit(user_identifier, 'sms_verification_daily', 10, 10) THEN
    RAISE EXCEPTION 'Daily rate limit exceeded for SMS verification. Please contact support.';
  END IF;

  verification_code := lpad(floor(random() * 100000000)::text, 8, '0');

  INSERT INTO public.transaction_verifications (
    user_id,
    fund_id,
    beneficiary_contact_id,
    verification_type,
    verification_code,
    ip_address,
    device_fingerprint
  ) VALUES (
    p_user_id,
    p_fund_id,
    p_beneficiary_contact_id,
    p_verification_type,
    verification_code,
    p_ip_address,
    p_device_fingerprint
  ) RETURNING id INTO verification_id;

  RETURN verification_id;
END;
$function$;

-- 5) Enforce real encryption key presence (fail closed)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key_id text DEFAULT 'user_data'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := COALESCE(
    current_setting('app.encryption_key_' || key_id, true),
    current_setting('app.encryption_key', true),
    NULL
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
$function$;
