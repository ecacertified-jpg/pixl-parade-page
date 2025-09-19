-- Modify create_business_collective_fund to auto-create business account if needed
CREATE OR REPLACE FUNCTION public.create_business_collective_fund(p_business_id uuid, p_product_id uuid, p_beneficiary_user_id uuid, p_title text, p_description text DEFAULT NULL::text, p_target_amount numeric DEFAULT 10000, p_currency text DEFAULT 'XOF'::text, p_occasion text DEFAULT 'Cadeau offert par commerce'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  fund_id UUID;
  business_fund_id UUID;
  business_name TEXT;
  actual_business_id UUID;
  user_profile RECORD;
BEGIN
  -- Try to find business account by id first, then by user_id
  SELECT ba.id, ba.business_name INTO actual_business_id, business_name
  FROM public.business_accounts ba
  WHERE (ba.id = p_business_id OR ba.user_id = p_business_id) 
  AND ba.user_id = auth.uid();
  
  -- If no business account found, create one automatically
  IF actual_business_id IS NULL THEN
    -- Get user profile for business name
    SELECT first_name, last_name INTO user_profile
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    -- Create default business name
    business_name := COALESCE(user_profile.first_name || ' ' || user_profile.last_name, 'Mon Commerce');
    
    -- Create business account
    INSERT INTO public.business_accounts (
      user_id,
      business_name,
      business_type,
      is_active
    ) VALUES (
      auth.uid(),
      business_name,
      'commerce',
      true
    ) RETURNING id INTO actual_business_id;
  END IF;

  -- Verify we have a business account now
  IF actual_business_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create or find business account';
  END IF;

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
    actual_business_id,
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
    actual_business_id,
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
      'business_id', actual_business_id,
      'business_name', business_name,
      'product_id', p_product_id
    )
  );

  RETURN fund_id;
END;
$function$;