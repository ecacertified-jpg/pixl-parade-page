-- Fix security settings based on verification
-- 1) Set SECURITY INVOKER on the view if it exists
ALTER VIEW IF EXISTS public.fund_activities_secure SET (security_invoker = true);

-- 2) Ensure function uses a safe search_path
ALTER FUNCTION IF EXISTS public.mask_contributor_info(text, boolean)
  SET search_path = public;

-- 3) Move pg_net extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION IF EXISTS pg_net SET SCHEMA extensions;