CREATE TABLE public.onboarding_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_method text NOT NULL,
  page_slug text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own shares"
  ON public.onboarding_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shares"
  ON public.onboarding_shares FOR SELECT TO authenticated
  USING (auth.uid() = user_id);