
-- Vue sécurisée pour transaction_verifications (sans code ni token)
CREATE OR REPLACE VIEW public.transaction_verifications_safe AS
SELECT 
  id,
  user_id,
  fund_id,
  beneficiary_contact_id,
  verification_type,
  is_verified,
  expires_at,
  created_at,
  verified_at,
  verification_attempts,
  blocked_until
  -- verification_code, verification_token, ip_address, device_fingerprint sont exclus
FROM public.transaction_verifications
WHERE user_id = auth.uid();

-- Permissions
GRANT SELECT ON public.transaction_verifications_safe TO authenticated;

-- Documentation
COMMENT ON VIEW public.transaction_verifications_safe IS 'Vue des vérifications sans code/token sensibles - filtré par utilisateur';
