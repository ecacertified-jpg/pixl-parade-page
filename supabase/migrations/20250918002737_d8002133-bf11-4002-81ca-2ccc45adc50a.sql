-- Fix the find_users_outside_delivery_zones function to use correct columns
CREATE OR REPLACE FUNCTION public.find_users_outside_delivery_zones(p_business_id uuid, p_search_term text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, phone text, address text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  business_zones jsonb;
BEGIN
  -- Get the business delivery zones
  SELECT ba.delivery_zones INTO business_zones
  FROM public.business_accounts ba
  WHERE ba.id = p_business_id OR ba.user_id = p_business_id;
  
  -- Return users who are NOT in the delivery zones
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    NULL::text as email,  -- Profiles table doesn't have email column
    p.phone,
    p.city as address     -- Use city as address since address column doesn't exist
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
  AND (
    -- Apply search filter if provided
    p_search_term IS NULL OR
    LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE LOWER('%' || p_search_term || '%') OR
    LOWER(COALESCE(p.phone, '')) LIKE LOWER('%' || p_search_term || '%')
  )
  AND (
    -- Users with no city OR users whose city doesn't match any active delivery zone
    p.city IS NULL OR
    (
      business_zones IS NOT NULL AND 
      jsonb_array_length(business_zones) > 0 AND
      NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(business_zones) AS zone
        WHERE LOWER(p.city) LIKE LOWER('%' || (zone->>'name') || '%')
        AND (zone->>'active')::boolean IS NOT FALSE
      )
    ) OR
    -- If business has no delivery zones configured, show all users
    (business_zones IS NULL OR jsonb_array_length(business_zones) = 0)
  )
  ORDER BY p.first_name, p.last_name
  LIMIT 50;
END;
$function$;