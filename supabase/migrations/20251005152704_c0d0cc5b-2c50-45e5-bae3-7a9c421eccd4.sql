-- Extension de la table collective_funds pour les surprises
ALTER TABLE public.collective_funds 
ADD COLUMN IF NOT EXISTS is_surprise BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS surprise_reveal_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS surprise_message TEXT,
ADD COLUMN IF NOT EXISTS surprise_song_prompt TEXT;

-- Table pour les contributeurs invités à une surprise
CREATE TABLE IF NOT EXISTS public.surprise_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_surprise BOOLEAN DEFAULT false,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fund_id, contributor_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_surprise_contributors_fund ON public.surprise_contributors(fund_id);
CREATE INDEX IF NOT EXISTS idx_surprise_contributors_contributor ON public.surprise_contributors(contributor_id);
CREATE INDEX IF NOT EXISTS idx_collective_funds_surprise_reveal ON public.collective_funds(surprise_reveal_date) WHERE is_surprise = true;

-- Enable RLS
ALTER TABLE public.surprise_contributors ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour surprise_contributors
CREATE POLICY "Contributors can view their invitations"
ON public.surprise_contributors FOR SELECT
USING (auth.uid() = contributor_id);

CREATE POLICY "Fund creators can manage surprise contributors"
ON public.surprise_contributors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = surprise_contributors.fund_id
    AND cf.creator_id = auth.uid()
  )
);

-- Modifier RLS de collective_funds pour cacher les surprises au bénéficiaire
DROP POLICY IF EXISTS "Users can view funds with friend access" ON public.collective_funds;

CREATE POLICY "Users can view funds with friend access"
ON public.collective_funds FOR SELECT
USING (
  auth.uid() = creator_id 
  OR is_public = true 
  OR EXISTS (
    SELECT 1 FROM fund_contributions fc
    WHERE fc.fund_id = collective_funds.id AND fc.contributor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM contact_relationships cr
    WHERE ((cr.user_a = auth.uid() AND cr.user_b = collective_funds.creator_id) 
    OR (cr.user_b = auth.uid() AND cr.user_a = collective_funds.creator_id))
    AND cr.can_see_funds = true
  )
  OR can_see_fund_for_friend(id, auth.uid())
  -- Empêcher le bénéficiaire de voir les surprises non révélées
  OR (
    is_surprise = true 
    AND (surprise_reveal_date IS NULL OR surprise_reveal_date <= now())
    AND beneficiary_contact_id IN (
      SELECT id FROM contacts WHERE user_id = auth.uid()
    )
  )
  -- Permettre aux contributeurs invités de voir la surprise
  OR EXISTS (
    SELECT 1 FROM surprise_contributors sc
    WHERE sc.fund_id = collective_funds.id AND sc.contributor_id = auth.uid()
  )
);

-- Fonction pour vérifier si une surprise doit être révélée
CREATE OR REPLACE FUNCTION public.get_surprises_to_reveal()
RETURNS TABLE(
  fund_id UUID,
  creator_id UUID,
  beneficiary_contact_id UUID,
  surprise_message TEXT,
  surprise_song_prompt TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id,
    cf.creator_id,
    cf.beneficiary_contact_id,
    cf.surprise_message,
    cf.surprise_song_prompt
  FROM public.collective_funds cf
  WHERE cf.is_surprise = true
  AND cf.surprise_reveal_date <= now()
  AND cf.status = 'active';
END;
$$;

-- Fonction pour marquer une surprise comme révélée
CREATE OR REPLACE FUNCTION public.mark_surprise_revealed(p_fund_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.collective_funds
  SET status = 'target_reached'
  WHERE id = p_fund_id AND is_surprise = true;
  
  -- Notifier tous les contributeurs
  INSERT INTO public.scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  )
  SELECT 
    sc.contributor_id,
    'surprise_revealed',
    '🎉 La surprise est révélée !',
    'La cagnotte surprise que vous avez soutenue a été révélée à son bénéficiaire !',
    now(),
    ARRAY['email', 'push', 'in_app'],
    jsonb_build_object('fund_id', p_fund_id)
  FROM public.surprise_contributors sc
  WHERE sc.fund_id = p_fund_id;
END;
$$;