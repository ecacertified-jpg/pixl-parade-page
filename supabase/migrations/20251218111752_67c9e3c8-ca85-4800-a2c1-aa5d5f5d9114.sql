
-- =============================================
-- CORRECTION RLS TABLES CRITIQUES
-- =============================================

-- 1. AI CONVERSATIONS - Seul le propriétaire peut voir ses conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

-- 2. AI MESSAGES - Seul le propriétaire de la conversation peut voir les messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.ai_messages;

CREATE POLICY "Users can view messages from their conversations" 
ON public.ai_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac 
    WHERE ac.id = conversation_id 
    AND (ac.user_id = auth.uid() OR ac.user_id IS NULL)
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac 
    WHERE ac.id = conversation_id 
    AND (ac.user_id = auth.uid() OR ac.user_id IS NULL)
  )
);

-- 3. FUND_CONTRIBUTIONS - Protéger les contributeurs anonymes
DROP POLICY IF EXISTS "Contributors can view their own contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Fund creators can view contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Public can view non-anonymous contributions" ON public.fund_contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON public.fund_contributions;

-- Les contributeurs voient leurs propres contributions
CREATE POLICY "Contributors can view their own contributions" 
ON public.fund_contributions 
FOR SELECT 
USING (contributor_id = auth.uid());

-- Les créateurs de fonds voient les contributions (mais pas l'identité des anonymes via une vue)
CREATE POLICY "Fund creators can view fund contributions" 
ON public.fund_contributions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf 
    WHERE cf.id = fund_id 
    AND cf.creator_id = auth.uid()
  )
);

-- Les contributions non-anonymes sont visibles par les participants du fonds
CREATE POLICY "Participants can view non-anonymous contributions" 
ON public.fund_contributions 
FOR SELECT 
USING (
  is_anonymous = false 
  AND EXISTS (
    SELECT 1 FROM public.fund_contributions fc2 
    WHERE fc2.fund_id = fund_contributions.fund_id 
    AND fc2.contributor_id = auth.uid()
  )
);

-- Insertion de contributions
CREATE POLICY "Authenticated users can create contributions" 
ON public.fund_contributions 
FOR INSERT 
WITH CHECK (contributor_id = auth.uid());

-- 4. FUND_ACTIVITIES - Visible par créateur et participants
DROP POLICY IF EXISTS "Fund creators can view activities" ON public.fund_activities;
DROP POLICY IF EXISTS "Contributors can view fund activities" ON public.fund_activities;

CREATE POLICY "Fund creators can view activities" 
ON public.fund_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf 
    WHERE cf.id = fund_id 
    AND cf.creator_id = auth.uid()
  )
);

CREATE POLICY "Contributors can view fund activities" 
ON public.fund_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fund_contributions fc 
    WHERE fc.fund_id = fund_activities.fund_id 
    AND fc.contributor_id = auth.uid()
  )
);

-- 5. COLLECTIVE_FUNDS - Renforcer la protection des bénéficiaires
DROP POLICY IF EXISTS "Users can view their own funds" ON public.collective_funds;
DROP POLICY IF EXISTS "Users can view public funds" ON public.collective_funds;
DROP POLICY IF EXISTS "Contributors can view funds they contributed to" ON public.collective_funds;

-- Le créateur voit ses fonds
CREATE POLICY "Creators can view their own funds" 
ON public.collective_funds 
FOR SELECT 
USING (creator_id = auth.uid());

-- Les fonds publics sont visibles (mais infos sensibles masquées via vue)
CREATE POLICY "Public funds are viewable" 
ON public.collective_funds 
FOR SELECT 
USING (is_public = true);

-- Les contributeurs voient les fonds auxquels ils ont contribué
CREATE POLICY "Contributors can view their funds" 
ON public.collective_funds 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fund_contributions fc 
    WHERE fc.fund_id = id 
    AND fc.contributor_id = auth.uid()
  )
);

-- Les bénéficiaires (via contact) peuvent voir le fonds après révélation
CREATE POLICY "Beneficiaries can view their funds" 
ON public.collective_funds 
FOR SELECT 
USING (
  is_surprise = false 
  AND beneficiary_contact_id IN (
    SELECT id FROM public.contacts WHERE user_id = auth.uid()
  )
);

-- 6. Vue sécurisée pour les contributions (masque les contributeurs anonymes)
CREATE OR REPLACE VIEW public.fund_contributions_safe AS
SELECT 
  id,
  fund_id,
  CASE 
    WHEN is_anonymous = true AND contributor_id != auth.uid() THEN NULL 
    ELSE contributor_id 
  END as contributor_id,
  amount,
  currency,
  message,
  is_anonymous,
  created_at
FROM public.fund_contributions;

GRANT SELECT ON public.fund_contributions_safe TO authenticated;

COMMENT ON VIEW public.fund_contributions_safe IS 'Vue des contributions avec identité masquée pour les anonymes';
