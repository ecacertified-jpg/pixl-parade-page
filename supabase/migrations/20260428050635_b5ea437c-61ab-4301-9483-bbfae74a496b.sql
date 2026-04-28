ALTER TABLE public.collective_funds
  ADD COLUMN IF NOT EXISTS is_external_product boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_product_url text,
  ADD COLUMN IF NOT EXISTS external_product_name text,
  ADD COLUMN IF NOT EXISTS external_product_image_url text,
  ADD COLUMN IF NOT EXISTS external_platform text;

CREATE INDEX IF NOT EXISTS idx_collective_funds_is_external_product
  ON public.collective_funds (is_external_product)
  WHERE is_external_product = true;

CREATE TABLE IF NOT EXISTS public.external_purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','purchased','shipped','delivered','cancelled','refunded')),
  external_url text NOT NULL,
  product_name text NOT NULL,
  estimated_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  actual_purchase_amount numeric,
  external_platform text,
  purchased_by_admin_id uuid,
  purchased_at timestamp with time zone,
  external_order_reference text,
  proof_url text,
  delivery_address text,
  beneficiary_phone text,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (fund_id)
);

CREATE INDEX IF NOT EXISTS idx_external_purchase_requests_status
  ON public.external_purchase_requests (status);
CREATE INDEX IF NOT EXISTS idx_external_purchase_requests_fund_id
  ON public.external_purchase_requests (fund_id);

DROP TRIGGER IF EXISTS trg_external_purchase_requests_updated_at ON public.external_purchase_requests;
CREATE TRIGGER trg_external_purchase_requests_updated_at
BEFORE UPDATE ON public.external_purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.external_purchase_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "epr_select_creator_or_admin" ON public.external_purchase_requests;
CREATE POLICY "epr_select_creator_or_admin"
ON public.external_purchase_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = external_purchase_requests.fund_id
      AND cf.creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.collective_funds cf
    JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
    WHERE cf.id = external_purchase_requests.fund_id
      AND c.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "epr_admin_insert" ON public.external_purchase_requests;
CREATE POLICY "epr_admin_insert"
ON public.external_purchase_requests
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "epr_admin_update" ON public.external_purchase_requests;
CREATE POLICY "epr_admin_update"
ON public.external_purchase_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "epr_admin_delete" ON public.external_purchase_requests;
CREATE POLICY "epr_admin_delete"
ON public.external_purchase_requests
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));