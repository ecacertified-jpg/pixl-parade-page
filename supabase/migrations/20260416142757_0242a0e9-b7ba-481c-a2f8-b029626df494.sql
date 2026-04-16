CREATE TABLE public.page_gift_promises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL,
  page_type text NOT NULL CHECK (page_type IN ('birthday', 'event')),
  page_owner_id uuid NOT NULL,
  is_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, page_id, page_type)
);

ALTER TABLE public.page_gift_promises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promises" ON public.page_gift_promises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promises" ON public.page_gift_promises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own promises" ON public.page_gift_promises
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Page owners can view promises for their pages" ON public.page_gift_promises
  FOR SELECT USING (auth.uid() = page_owner_id);

CREATE INDEX idx_page_gift_promises_user ON public.page_gift_promises(user_id);
CREATE INDEX idx_page_gift_promises_page ON public.page_gift_promises(page_id, page_type);