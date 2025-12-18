
-- =============================================
-- CORRECTIONS CRITIQUES RESTANTES
-- =============================================

-- 1. Supprimer la politique permissive sur business_accounts
DROP POLICY IF EXISTS "Anyone can view active business public info" ON public.business_accounts;

-- 2. Vue publique sécurisée pour collective_funds (sans creator_id/beneficiary)
CREATE OR REPLACE VIEW public.collective_funds_public AS
SELECT 
  id,
  title,
  description,
  occasion,
  target_amount,
  current_amount,
  currency,
  deadline_date,
  is_public,
  status,
  share_token,
  created_at
  -- creator_id, beneficiary_contact_id, business_product_id, is_surprise exclus
FROM public.collective_funds
WHERE is_public = true AND status = 'active';

GRANT SELECT ON public.collective_funds_public TO anon, authenticated;

COMMENT ON VIEW public.collective_funds_public IS 'Vue publique des fonds sans identifiants sensibles du créateur/bénéficiaire';

-- 3. Restreindre les insertions sur admin_audit_logs aux admins uniquement
DROP POLICY IF EXISTS "System can create audit logs" ON public.admin_audit_logs;

CREATE POLICY "Only admins can create audit logs" 
ON public.admin_audit_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- 4. Restreindre les insertions sur security_events
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

CREATE POLICY "Authenticated users can log their own events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 5. Restreindre les insertions sur business_registration_logs aux admins
DROP POLICY IF EXISTS "System can insert registration logs" ON public.business_registration_logs;

CREATE POLICY "Only admins can insert registration logs" 
ON public.business_registration_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- 6. Restreindre ai_conversations pour sessions anonymes
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anyone can select conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.ai_conversations;

-- Les utilisateurs authentifiés accèdent leurs conversations
CREATE POLICY "Authenticated users can manage their conversations" 
ON public.ai_conversations 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Les sessions anonymes (user_id NULL) peuvent créer des conversations
CREATE POLICY "Anonymous sessions can create conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (user_id IS NULL);

-- 7. Restreindre ai_messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.ai_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Anyone can select messages" ON public.ai_messages;

-- Les utilisateurs accèdent aux messages de leurs conversations
CREATE POLICY "Users can manage their conversation messages" 
ON public.ai_messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac 
    WHERE ac.id = conversation_id 
    AND ac.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac 
    WHERE ac.id = conversation_id 
    AND ac.user_id = auth.uid()
  )
);
