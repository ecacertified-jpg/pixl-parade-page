
CREATE TABLE public.page_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type text NOT NULL CHECK (page_type IN ('birthday', 'event')),
  page_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, page_type, page_id)
);

ALTER TABLE public.page_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page follows" ON public.page_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow pages" ON public.page_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow pages" ON public.page_follows
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_page_follows_user ON public.page_follows(user_id);
CREATE INDEX idx_page_follows_page ON public.page_follows(page_type, page_id);
