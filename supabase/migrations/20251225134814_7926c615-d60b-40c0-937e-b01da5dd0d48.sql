-- Add a wrapper function for log_security_event that accepts 7 parameters (including inet)
-- This fixes the signature mismatch where log_admin_access() calls with 7 params
-- but only the 6-param version exists

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_target_user_id UUID,  -- extra param that was in old signature
  p_ip_address INET,      -- inet type from inet_client_addr()
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Forward to the 6-param version, converting inet to text
  -- and ignoring the target_user_id (which can be included in metadata if needed)
  PERFORM public.log_security_event(
    p_event_type,
    p_user_id,
    COALESCE(p_ip_address::TEXT, 'unknown'),
    p_action,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('target_user_id', p_target_user_id),
    p_severity
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, UUID, INET, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, UUID, INET, TEXT, JSONB, TEXT) TO service_role;