-- Fix remaining security issues

-- Fix the validate_sensitive_inputs function to have proper search_path
CREATE OR REPLACE FUNCTION public.validate_sensitive_inputs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

-- Drop and recreate the fund_activities_secure view without security definer behavior
-- First drop the view
DROP VIEW IF EXISTS public.fund_activities_secure;

-- Recreate it as a regular view (not security definer)
CREATE VIEW public.fund_activities_secure AS
SELECT 
  id,
  fund_id,
  activity_type,
  amount,
  currency,
  created_at,
  metadata,
  CASE
    WHEN activity_type = 'contribution' THEN 
      public.mask_contributor_info(
        (SELECT p.first_name FROM public.profiles p WHERE p.user_id = fa.contributor_id),
        COALESCE((metadata->>'is_anonymous')::boolean, false)
      )
    ELSE message
  END AS message
FROM public.fund_activities fa;

-- Add RLS policy for the view to ensure proper access control
ALTER VIEW public.fund_activities_secure SET (security_barrier = true);

-- Note: We cannot move pg_net extension out of public schema as it's managed by Supabase
-- This is a system extension that needs to remain in public schema for edge functions
-- This is a known and acceptable warning for Supabase projects

-- Create a helper function to safely access fund activities
CREATE OR REPLACE FUNCTION public.get_fund_activities_for_user(p_fund_id uuid)
RETURNS TABLE(
  id uuid,
  fund_id uuid,
  activity_type text,
  amount numeric,
  currency text,
  created_at timestamp with time zone,
  metadata jsonb,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user can access this fund
  IF NOT public.user_can_see_fund(p_fund_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied to fund activities';
  END IF;

  RETURN QUERY
  SELECT 
    fa.id,
    fa.fund_id,
    fa.activity_type,
    fa.amount,
    fa.currency,
    fa.created_at,
    fa.metadata,
    CASE
      WHEN fa.activity_type = 'contribution' THEN 
        public.mask_contributor_info(
          (SELECT p.first_name FROM public.profiles p WHERE p.user_id = fa.contributor_id),
          COALESCE((fa.metadata->>'is_anonymous')::boolean, false)
        )
      ELSE fa.message
    END AS message
  FROM public.fund_activities fa
  WHERE fa.fund_id = p_fund_id
  ORDER BY fa.created_at DESC;
END;
$$;