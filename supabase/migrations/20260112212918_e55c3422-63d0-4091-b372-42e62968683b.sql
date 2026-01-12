-- RLS Policies for Super Admins to manage all business orders

-- Admins can view all business orders
CREATE POLICY "Admins can view all business orders"
ON public.business_orders FOR SELECT
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can update any business order
CREATE POLICY "Admins can update any business order"
ON public.business_orders FOR UPDATE
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can delete any business order
CREATE POLICY "Admins can delete any business order"
ON public.business_orders FOR DELETE
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can view all collective fund orders
CREATE POLICY "Admins can view all collective fund orders"
ON public.collective_fund_orders FOR SELECT
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can update any collective fund order
CREATE POLICY "Admins can update any collective fund order"
ON public.collective_fund_orders FOR UPDATE
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can delete any collective fund order
CREATE POLICY "Admins can delete any collective fund order"
ON public.collective_fund_orders FOR DELETE
TO authenticated
USING (is_active_admin(auth.uid()));