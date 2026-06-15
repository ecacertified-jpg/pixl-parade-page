CREATE TABLE IF NOT EXISTS public.event_wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  product_url text,
  price_estimate numeric,
  currency text NOT NULL DEFAULT 'XOF',
  position integer NOT NULL DEFAULT 0,
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_by_name text,
  reserved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_wishlist_items_event_idx ON public.event_wishlist_items(event_id);

GRANT SELECT ON public.event_wishlist_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_wishlist_items TO authenticated;
GRANT ALL ON public.event_wishlist_items TO service_role;

ALTER TABLE public.event_wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view items of active events"
ON public.event_wishlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_wishlist_items.event_id
      AND ep.is_active = true
  )
);

CREATE POLICY "Event creator can insert items"
ON public.event_wishlist_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_wishlist_items.event_id
      AND ep.creator_id = auth.uid()
  )
);

CREATE POLICY "Event creator can delete items"
ON public.event_wishlist_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_wishlist_items.event_id
      AND ep.creator_id = auth.uid()
  )
);

-- Update : creator peut tout modifier ; tout authentifié peut réserver/libérer pour lui-même
CREATE POLICY "Creator or reserving user can update items"
ON public.event_wishlist_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_wishlist_items.event_id
      AND ep.creator_id = auth.uid()
  )
  OR reserved_by IS NULL
  OR reserved_by = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_wishlist_items.event_id
      AND ep.creator_id = auth.uid()
  )
  OR reserved_by IS NULL
  OR reserved_by = auth.uid()
);

CREATE TRIGGER trg_event_wishlist_updated_at
BEFORE UPDATE ON public.event_wishlist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();