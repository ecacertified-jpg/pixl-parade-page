
-- Table pour les codes de partage des admins
CREATE TABLE public.admin_share_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  clicks_count integer NOT NULL DEFAULT 0,
  signups_count integer NOT NULL DEFAULT 0,
  assignments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour lookup rapide par code
CREATE INDEX idx_admin_share_codes_code ON public.admin_share_codes(code) WHERE is_active = true;
CREATE INDEX idx_admin_share_codes_admin ON public.admin_share_codes(admin_user_id);

-- RLS
ALTER TABLE public.admin_share_codes ENABLE ROW LEVEL SECURITY;

-- Les admins actifs peuvent voir leurs propres codes
CREATE POLICY "Admins can view own share codes"
ON public.admin_share_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = admin_share_codes.admin_user_id
    AND admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Les admins actifs peuvent créer leurs propres codes
CREATE POLICY "Admins can insert own share codes"
ON public.admin_share_codes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = admin_share_codes.admin_user_id
    AND admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Les admins actifs peuvent mettre à jour leurs propres codes
CREATE POLICY "Admins can update own share codes"
ON public.admin_share_codes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = admin_share_codes.admin_user_id
    AND admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Lecture publique par code (pour la page /join/:code - utilisateurs non authentifiés)
CREATE POLICY "Anyone can read active share codes by code"
ON public.admin_share_codes FOR SELECT
USING (is_active = true);

-- Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION public.generate_admin_share_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
BEGIN
  LOOP
    new_code := 'ADM-';
    FOR i IN 1..4 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Vérifier l'unicité
    IF NOT EXISTS (SELECT 1 FROM admin_share_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Fonction pour incrémenter les compteurs (SECURITY DEFINER pour l'edge function)
CREATE OR REPLACE FUNCTION public.increment_share_code_stat(
  p_code text,
  p_field text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field NOT IN ('clicks_count', 'signups_count', 'assignments_count') THEN
    RAISE EXCEPTION 'Invalid field name';
  END IF;
  
  EXECUTE format(
    'UPDATE admin_share_codes SET %I = %I + 1 WHERE code = $1 AND is_active = true',
    p_field, p_field
  ) USING p_code;
END;
$$;
