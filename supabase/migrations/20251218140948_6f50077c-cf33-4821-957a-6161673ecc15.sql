-- Corriger la policy d'insert anonyme sur ai_conversations (plus explicite)
DROP POLICY IF EXISTS "Anonymous sessions can create conversations" ON public.ai_conversations;

CREATE POLICY "Anonymous sessions can create conversations"
ON public.ai_conversations
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND session_id IS NOT NULL
);
