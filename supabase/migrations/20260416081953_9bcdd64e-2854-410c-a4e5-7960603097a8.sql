
CREATE TABLE public.album_photo_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.birthday_page_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT album_photo_reactions_unique UNIQUE (photo_id, user_id, reaction_type),
  CONSTRAINT album_photo_reactions_type_check CHECK (reaction_type IN ('heart', 'laugh', 'wow', 'clap', 'party'))
);

CREATE INDEX idx_album_photo_reactions_photo_id ON public.album_photo_reactions(photo_id);
CREATE INDEX idx_album_photo_reactions_user_id ON public.album_photo_reactions(user_id);

ALTER TABLE public.album_photo_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.album_photo_reactions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reactions"
ON public.album_photo_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.album_photo_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
