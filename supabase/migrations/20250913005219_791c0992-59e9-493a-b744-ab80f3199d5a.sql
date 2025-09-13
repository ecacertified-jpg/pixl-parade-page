-- Create business collective funds extension
-- Add columns to collective_funds to support business-initiated funds
ALTER TABLE public.collective_funds 
ADD COLUMN IF NOT EXISTS created_by_business_id UUID REFERENCES public.business_accounts(id),
ADD COLUMN IF NOT EXISTS business_product_id UUID REFERENCES public.products(id);

-- Create business_collective_funds table for tracking business-initiated funds
CREATE TABLE IF NOT EXISTS public.business_collective_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  beneficiary_user_id UUID NOT NULL,
  auto_notifications BOOLEAN DEFAULT true,
  notification_schedule JSONB DEFAULT '{"intervals": [14, 7, 3, 1], "methods": ["push", "sms"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(fund_id) -- One business fund per collective fund
);

-- Enable RLS on business_collective_funds
ALTER TABLE public.business_collective_funds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_collective_funds
CREATE POLICY "Business owners can manage their collective funds"
ON public.business_collective_funds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
);

-- Create RLS policy for beneficiaries to see funds created for them
CREATE POLICY "Beneficiaries can view business funds created for them"
ON public.business_collective_funds
FOR SELECT
USING (beneficiary_user_id = auth.uid());

-- Create function to find users in business delivery zones
CREATE OR REPLACE FUNCTION public.find_users_in_delivery_zones(
  p_business_id UUID,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For now, return all users (delivery zone matching will be enhanced later)
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.address
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
  AND (
    p_search_term IS NULL OR
    LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE LOWER('%' || p_search_term || '%') OR
    LOWER(COALESCE(p.email, '')) LIKE LOWER('%' || p_search_term || '%') OR
    LOWER(COALESCE(p.phone, '')) LIKE LOWER('%' || p_search_term || '%')
  )
  ORDER BY p.first_name, p.last_name
  LIMIT 50;
END;
$$;

-- Create function to create business collective fund
CREATE OR REPLACE FUNCTION public.create_business_collective_fund(
  p_business_id UUID,
  p_product_id UUID,
  p_beneficiary_user_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_target_amount NUMERIC,
  p_currency TEXT DEFAULT 'XOF',
  p_occasion TEXT DEFAULT 'Cadeau offert par commerce'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_id UUID;
  business_fund_id UUID;
  business_name TEXT;
BEGIN
  -- Verify business ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.business_accounts 
    WHERE id = p_business_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only create funds for your own business';
  END IF;

  -- Get business name for the fund title
  SELECT ba.business_name INTO business_name
  FROM public.business_accounts ba
  WHERE ba.id = p_business_id;

  -- Create the collective fund
  INSERT INTO public.collective_funds (
    creator_id,
    title,
    description,
    target_amount,
    currency,
    occasion,
    status,
    created_by_business_id,
    business_product_id
  ) VALUES (
    auth.uid(),
    p_title,
    p_description,
    p_target_amount,
    p_currency,
    p_occasion,
    'active',
    p_business_id,
    p_product_id
  ) RETURNING id INTO fund_id;

  -- Create the business collective fund record
  INSERT INTO public.business_collective_funds (
    fund_id,
    business_id,
    product_id,
    beneficiary_user_id
  ) VALUES (
    fund_id,
    p_business_id,
    p_product_id,
    p_beneficiary_user_id
  ) RETURNING id INTO business_fund_id;

  -- Create initial notification for beneficiary
  INSERT INTO public.scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  ) VALUES (
    p_beneficiary_user_id,
    'business_fund_created',
    '🎁 Cotisation créée pour vous !',
    business_name || ' organise une cotisation pour vous offrir un cadeau ! Vos proches pourront y contribuer.',
    now(),
    ARRAY['email', 'push', 'in_app'],
    jsonb_build_object(
      'fund_id', fund_id,
      'business_id', p_business_id,
      'business_name', business_name,
      'product_id', p_product_id
    )
  );

  RETURN fund_id;
END;
$$;