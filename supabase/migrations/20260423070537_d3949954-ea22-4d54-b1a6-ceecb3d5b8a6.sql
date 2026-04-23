CREATE TABLE public.birthday_page_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.birthday_pages(id) ON DELETE CASCADE,
  friend_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bpf_friend_or_contact CHECK (friend_user_id IS NOT NULL OR contact_id IS NOT NULL)
);

CREATE UNIQUE INDEX bpf_unique_user ON public.birthday_page_friends(page_id, friend_user_id) WHERE friend_user_id IS NOT NULL;
CREATE UNIQUE INDEX bpf_unique_contact ON public.birthday_page_friends(page_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_bpf_page ON public.birthday_page_friends(page_id);

ALTER TABLE public.birthday_page_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page owner can view friends"
ON public.birthday_page_friends FOR SELECT
USING (EXISTS (SELECT 1 FROM public.birthday_pages WHERE id = page_id AND user_id = auth.uid()));

CREATE POLICY "Page owner can add friends"
ON public.birthday_page_friends FOR INSERT
WITH CHECK (
  added_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.birthday_pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Page owner can delete friends"
ON public.birthday_page_friends FOR DELETE
USING (EXISTS (SELECT 1 FROM public.birthday_pages WHERE id = page_id AND user_id = auth.uid()));