-- Créer une table pour stocker les informations de commande des cotisations
CREATE TABLE public.collective_fund_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  donor_phone TEXT NOT NULL,
  beneficiary_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  order_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter RLS
ALTER TABLE public.collective_fund_orders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can create orders for their own funds"
  ON public.collective_fund_orders
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view orders for funds they can access"
  ON public.collective_fund_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collective_funds cf
      WHERE cf.id = collective_fund_orders.fund_id
      AND user_can_see_fund(cf.id, auth.uid())
    )
  );

CREATE POLICY "Fund creators can update their orders"
  ON public.collective_fund_orders
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Trigger pour updated_at
CREATE TRIGGER update_collective_fund_orders_updated_at
  BEFORE UPDATE ON public.collective_fund_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();