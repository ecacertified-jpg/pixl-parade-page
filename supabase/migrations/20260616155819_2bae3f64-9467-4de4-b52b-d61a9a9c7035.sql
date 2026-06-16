
ALTER TABLE public.event_vendors
  ADD COLUMN IF NOT EXISTS booking_status text NOT NULL DEFAULT 'proposed'
    CHECK (booking_status IN ('proposed','contacted','confirmed','cancelled')),
  ADD COLUMN IF NOT EXISTS quote_amount numeric,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS requested_date date,
  ADD COLUMN IF NOT EXISTS contact_logged_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_event_vendors_business ON public.event_vendors(business_account_id);
