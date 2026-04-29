-- Table for external products favorited from other platforms (Jumia, Amazon, etc.)
CREATE TABLE public.external_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  external_url text NOT NULL,
  product_name text NOT NULL,
  image_url text,
  estimated_price numeric NOT NULL CHECK (estimated_price > 0),
  currency text NOT NULL DEFAULT 'XOF',
  country_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, external_url)
);

CREATE INDEX idx_external_favorites_user ON public.external_favorites(user_id, created_at DESC);

ALTER TABLE public.external_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ext_fav_select_owner"
  ON public.external_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ext_fav_select_admin"
  ON public.external_favorites FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "ext_fav_insert_owner"
  ON public.external_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ext_fav_update_owner"
  ON public.external_favorites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ext_fav_delete_owner"
  ON public.external_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_external_favorites_updated_at
  BEFORE UPDATE ON public.external_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend external_purchase_requests status enum to support beneficiary self-purchase flow
ALTER TABLE public.external_purchase_requests
  DROP CONSTRAINT IF EXISTS external_purchase_requests_status_check;

ALTER TABLE public.external_purchase_requests
  ADD CONSTRAINT external_purchase_requests_status_check
  CHECK (status IN ('pending','awaiting_beneficiary_purchase','purchased','shipped','delivered','cancelled','refunded'));