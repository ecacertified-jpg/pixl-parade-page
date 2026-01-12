-- Table pour stocker les groupes de comptes en double détectés automatiquement
CREATE TABLE public.detected_duplicate_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('client', 'business')),
  match_criteria TEXT[] NOT NULL DEFAULT '{}',
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  account_ids UUID[] NOT NULL DEFAULT '{}',
  primary_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'dismissed', 'reviewed')),
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_detected_duplicates_type ON public.detected_duplicate_accounts(type);
CREATE INDEX idx_detected_duplicates_status ON public.detected_duplicate_accounts(status);
CREATE INDEX idx_detected_duplicates_confidence ON public.detected_duplicate_accounts(confidence);
CREATE INDEX idx_detected_duplicates_detected_at ON public.detected_duplicate_accounts(detected_at DESC);

-- Enable RLS
ALTER TABLE public.detected_duplicate_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and manage
CREATE POLICY "Admins can view duplicate accounts"
ON public.detected_duplicate_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Super admins can manage duplicate accounts"
ON public.detected_duplicate_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role = 'super_admin'
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_detected_duplicate_accounts_updated_at
BEFORE UPDATE ON public.detected_duplicate_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();