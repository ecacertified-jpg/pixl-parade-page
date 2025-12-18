-- Ajouter une politique RLS permettant aux sessions anonymes d'insérer des messages
-- dans les conversations où user_id est NULL

CREATE POLICY "Anonymous sessions can insert messages" 
ON ai_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_conversations ac 
    WHERE ac.id = ai_messages.conversation_id 
    AND ac.user_id IS NULL
  )
);