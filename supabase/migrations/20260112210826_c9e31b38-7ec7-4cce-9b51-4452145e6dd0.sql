-- First, check if is_active_admin function exists, if not create it
CREATE OR REPLACE FUNCTION public.is_active_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid
    AND is_active = true
  );
END;
$$;

-- RLS policies for products table - Super Admin access

-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can create products for any business
CREATE POLICY "Admins can create products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (is_active_admin(auth.uid()));

-- Admins can update any product
CREATE POLICY "Admins can update any product"
ON public.products FOR UPDATE
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can delete any product
CREATE POLICY "Admins can delete any product"
ON public.products FOR DELETE
TO authenticated
USING (is_active_admin(auth.uid()));

-- RLS policies for business_categories table - Super Admin access

-- Admins can view all business categories
CREATE POLICY "Admins can view all business categories"
ON public.business_categories FOR SELECT
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can create business categories
CREATE POLICY "Admins can create business categories"
ON public.business_categories FOR INSERT
TO authenticated
WITH CHECK (is_active_admin(auth.uid()));

-- Admins can update any business category
CREATE POLICY "Admins can update business categories"
ON public.business_categories FOR UPDATE
TO authenticated
USING (is_active_admin(auth.uid()));

-- Admins can delete any business category
CREATE POLICY "Admins can delete business categories"
ON public.business_categories FOR DELETE
TO authenticated
USING (is_active_admin(auth.uid()));