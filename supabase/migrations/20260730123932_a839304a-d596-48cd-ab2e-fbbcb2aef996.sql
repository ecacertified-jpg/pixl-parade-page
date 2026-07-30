ALTER TABLE public.collective_funds
  ADD COLUMN IF NOT EXISTS is_cash_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beneficiary_user_id uuid;

CREATE TABLE IF NOT EXISTS public.cash_gift_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  beneficiary_user_id uuid,
  beneficiary_contact_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending',
  payout_reference text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cash_gift_payouts_fund_id_key ON public.cash_gift_payouts(fund_id);

GRANT SELECT ON public.cash_gift_payouts TO authenticated;
GRANT ALL ON public.cash_gift_payouts TO service_role;

ALTER TABLE public.cash_gift_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator, beneficiary and admins can view cash payouts"
ON public.cash_gift_payouts FOR SELECT TO authenticated
USING (
  beneficiary_user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = cash_gift_payouts.fund_id AND cf.creator_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert cash payouts"
ON public.cash_gift_payouts FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update cash payouts"
ON public.cash_gift_payouts FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_cash_gift_payouts_updated_at
BEFORE UPDATE ON public.cash_gift_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();