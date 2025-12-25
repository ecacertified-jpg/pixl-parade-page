-- First drop the existing 6-parameter function, then recreate with correct column mappings
DROP FUNCTION IF EXISTS public.log_security_event(TEXT, UUID, TEXT, TEXT, JSONB, TEXT);

-- Recreate with correct column names (event_data instead of metadata, severity instead of risk_level)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    event_data,
    severity
  ) VALUES (
    p_event_type,
    COALESCE(p_user_id, auth.uid()),
    p_ip_address::inet,
    p_user_agent,
    p_metadata,
    p_severity
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Ensure grants are in place
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, TEXT, TEXT, JSONB, TEXT) TO service_role;