
-- FIX friend_form_tokens — create secure RPC with correct columns
CREATE OR REPLACE FUNCTION public.get_friend_form_token(p_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  token text,
  prefilled_name text,
  prefilled_relation text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, token, prefilled_name, prefilled_relation, status, expires_at, created_at
  FROM public.friend_form_tokens
  WHERE friend_form_tokens.token = p_token
    AND (expires_at IS NULL OR expires_at > now())
    AND status = 'pending'
  LIMIT 1;
$$;

-- Restrict the SELECT policy — only own tokens
DROP POLICY IF EXISTS "Anyone can read tokens by token value" ON public.friend_form_tokens;

CREATE POLICY "Users can read their own tokens"
ON public.friend_form_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
