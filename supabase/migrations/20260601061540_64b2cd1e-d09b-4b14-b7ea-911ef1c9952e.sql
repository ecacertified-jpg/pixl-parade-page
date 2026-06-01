-- Fix RLS policies on ai_conversations and ai_messages so anonymous chat sessions can be created.
-- Root cause: the "manage" policy targeted PUBLIC (which includes anon) with WITH CHECK (user_id = auth.uid()).
-- For anon (auth.uid() is null) this evaluated to null, and combined with PostgREST eval, blocked inserts.
-- Solution: scope the management policy to the authenticated role only, and keep an explicit anon-insert policy.

-- ai_conversations
DROP POLICY IF EXISTS "Authenticated users can manage their conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anonymous sessions can create conversations" ON public.ai_conversations;

CREATE POLICY "Authenticated users can manage their conversations"
ON public.ai_conversations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous sessions can create conversations"
ON public.ai_conversations
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Anonymous sessions can read their conversations"
ON public.ai_conversations
FOR SELECT
TO anon
USING (user_id IS NULL);

CREATE POLICY "Anonymous sessions can update their conversations"
ON public.ai_conversations
FOR UPDATE
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- ai_messages: same pattern (scope auth policies to authenticated, add anon access for session-based chats)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid='public.ai_messages'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_messages', r.polname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can read their messages"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can insert their messages"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update their messages"
ON public.ai_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Anonymous sessions can read their messages"
ON public.ai_messages
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id IS NULL
  )
);

CREATE POLICY "Anonymous sessions can insert their messages"
ON public.ai_messages
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id IS NULL
  )
);