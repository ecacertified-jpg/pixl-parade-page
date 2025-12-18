-- Allow anonymous (anon) clients to SELECT anonymous conversations (user_id is NULL).
-- Needed because INSERT ... RETURNING (used by supabase-js .insert().select()) is subject to SELECT RLS.

CREATE POLICY "Anonymous sessions can read conversations"
ON public.ai_conversations
FOR SELECT
TO anon
USING (user_id IS NULL);
