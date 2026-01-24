-- Table pour stocker les codes OTP WhatsApp
CREATE TABLE public.whatsapp_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'auth',
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  user_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par téléphone et expiration
CREATE INDEX idx_whatsapp_otp_phone_expires ON public.whatsapp_otp_codes(phone, expires_at);

-- Index pour nettoyage des codes expirés
CREATE INDEX idx_whatsapp_otp_expires ON public.whatsapp_otp_codes(expires_at);

-- Enable RLS - aucun accès direct (tout passe par edge functions avec service_role)
ALTER TABLE public.whatsapp_otp_codes ENABLE ROW LEVEL SECURITY;

-- Fonction de nettoyage automatique des codes expirés (appelée périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_whatsapp_otp()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.whatsapp_otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Commentaire pour documentation
COMMENT ON TABLE public.whatsapp_otp_codes IS 'Stocke les codes OTP temporaires envoyés via WhatsApp pour les pays sans SMS fiable';