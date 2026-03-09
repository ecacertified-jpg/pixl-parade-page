
-- Table for friend form sharing tokens
CREATE TABLE public.friend_form_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prefilled_name text,
  prefilled_relation text,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Index for fast token lookup
CREATE INDEX idx_friend_form_tokens_token ON public.friend_form_tokens(token);

-- Enable RLS
ALTER TABLE public.friend_form_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own tokens
CREATE POLICY "Users can create their own tokens"
ON public.friend_form_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Anyone can read by token (for public form page)
CREATE POLICY "Anyone can read tokens by token value"
ON public.friend_form_tokens FOR SELECT
TO anon, authenticated
USING (true);

-- Users can view their own tokens
CREATE POLICY "Users can update their own tokens"
ON public.friend_form_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
