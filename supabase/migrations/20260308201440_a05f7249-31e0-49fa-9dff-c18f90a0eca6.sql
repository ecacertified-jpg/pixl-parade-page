
-- 1. Add wave_merchant_phone to business_accounts
ALTER TABLE public.business_accounts 
  ADD COLUMN IF NOT EXISTS wave_merchant_phone text;

-- 2. Create payment_splits table
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_order_id uuid REFERENCES public.business_orders(id) ON DELETE SET NULL,
  total_client_amount numeric NOT NULL,
  vendor_amount numeric NOT NULL,
  platform_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  markup_rate numeric NOT NULL DEFAULT 0,
  vendor_wave_phone text,
  platform_wave_phone text,
  vendor_transfer_status text NOT NULL DEFAULT 'pending',
  platform_transfer_status text NOT NULL DEFAULT 'pending',
  vendor_transfer_ref text,
  platform_transfer_ref text,
  payment_method text NOT NULL DEFAULT 'wave',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- RLS
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Admins can see all splits
CREATE POLICY "Admins can manage payment_splits"
ON public.payment_splits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Business owners can see splits for their orders
CREATE POLICY "Business owners can view their splits"
ON public.payment_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_orders bo
    JOIN public.business_accounts ba ON ba.id = bo.business_account_id
    WHERE bo.id = payment_splits.business_order_id
    AND ba.user_id = auth.uid()
  )
);

-- 3. Insert platform_wave_phone setting
INSERT INTO public.platform_settings (setting_key, setting_value, setting_category, description)
VALUES ('platform_wave_phone', '{"value": ""}', 'finance', 'Numéro Wave de la plateforme JDV pour recevoir les commissions')
ON CONFLICT (setting_key) DO NOTHING;
