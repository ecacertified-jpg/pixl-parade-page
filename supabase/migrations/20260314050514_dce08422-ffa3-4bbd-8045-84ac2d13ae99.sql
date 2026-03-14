
-- Sous-cercles d'amis
CREATE TABLE public.friend_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7A5DC7',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assignation contact → cercle (un contact = max 1 cercle)
CREATE TABLE public.friend_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.friend_circles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id)
);

-- Indexes
CREATE INDEX idx_friend_circles_user_id ON public.friend_circles(user_id);
CREATE INDEX idx_friend_circle_members_circle_id ON public.friend_circle_members(circle_id);

-- RLS on friend_circles
ALTER TABLE public.friend_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own circles"
ON public.friend_circles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own circles"
ON public.friend_circles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circles"
ON public.friend_circles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own circles"
ON public.friend_circles FOR DELETE
USING (auth.uid() = user_id);

-- RLS on friend_circle_members (via join to friend_circles)
ALTER TABLE public.friend_circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own circle members"
ON public.friend_circle_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friend_circles
    WHERE id = friend_circle_members.circle_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can add to own circles"
ON public.friend_circle_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.friend_circles
    WHERE id = friend_circle_members.circle_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove from own circles"
ON public.friend_circle_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.friend_circles
    WHERE id = friend_circle_members.circle_id
    AND user_id = auth.uid()
  )
);
