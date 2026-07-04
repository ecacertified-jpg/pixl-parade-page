
-- Enums
DO $$ BEGIN
  CREATE TYPE public.inspiration_page_kind AS ENUM ('birthday','event','global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspiration_category AS ENUM ('divertissement','astuces','conseils','formations');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspiration_media_type AS ENUM ('video','image','text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Short token generator (base62, 10 chars)
CREATE OR REPLACE FUNCTION public.generate_inspiration_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(alphabet, 1 + floor(random() * 62)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Table
CREATE TABLE IF NOT EXISTS public.inspiration_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_kind public.inspiration_page_kind NOT NULL,
  page_id uuid NULL,
  author_id uuid NOT NULL,
  is_admin_post boolean NOT NULL DEFAULT false,
  category public.inspiration_category NOT NULL,
  subcategory text NOT NULL,
  media_type public.inspiration_media_type NOT NULL,
  media_url text NULL,
  thumbnail_url text NULL,
  title text NULL,
  body text NULL,
  share_token text NOT NULL UNIQUE DEFAULT public.generate_inspiration_token(),
  is_active boolean NOT NULL DEFAULT true,
  views_count integer NOT NULL DEFAULT 0,
  shares_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspiration_items_page ON public.inspiration_items(page_kind, page_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_inspiration_items_global ON public.inspiration_items(page_kind) WHERE page_kind = 'global' AND is_active;
CREATE INDEX IF NOT EXISTS idx_inspiration_items_category ON public.inspiration_items(category, subcategory);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_inspiration_items_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_inspiration_items_updated_at ON public.inspiration_items;
CREATE TRIGGER trg_inspiration_items_updated_at
BEFORE UPDATE ON public.inspiration_items
FOR EACH ROW EXECUTE FUNCTION public.tg_inspiration_items_updated_at();

-- Grants
GRANT SELECT ON public.inspiration_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspiration_items TO authenticated;
GRANT ALL ON public.inspiration_items TO service_role;

-- RLS
ALTER TABLE public.inspiration_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active items are viewable by everyone" ON public.inspiration_items;
CREATE POLICY "Active items are viewable by everyone"
ON public.inspiration_items FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Users can insert own items" ON public.inspiration_items;
CREATE POLICY "Users can insert own items"
ON public.inspiration_items FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    (is_admin_post = false AND page_kind IN ('birthday','event') AND page_id IS NOT NULL)
    OR (
      is_admin_post = true AND page_kind = 'global' AND page_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('super_admin','regional_admin')
      )
    )
  )
);

DROP POLICY IF EXISTS "Authors or admins can update items" ON public.inspiration_items;
CREATE POLICY "Authors or admins can update items"
ON public.inspiration_items FOR UPDATE
TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
)
WITH CHECK (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
);

DROP POLICY IF EXISTS "Authors or admins can delete items" ON public.inspiration_items;
CREATE POLICY "Authors or admins can delete items"
ON public.inspiration_items FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- RPC : increment views
CREATE OR REPLACE FUNCTION public.increment_inspiration_views(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.inspiration_items SET views_count = views_count + 1 WHERE id = _id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_inspiration_shares(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.inspiration_items SET shares_count = shares_count + 1 WHERE id = _id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_inspiration_by_token(_token text)
RETURNS SETOF public.inspiration_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.inspiration_items WHERE share_token = _token AND is_active = true LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.increment_inspiration_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_inspiration_shares(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inspiration_by_token(text) TO anon, authenticated;
