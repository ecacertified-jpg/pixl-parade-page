-- Update the find_users_in_delivery_zones function to properly filter users by business delivery zones
CREATE OR REPLACE FUNCTION public.find_users_in_delivery_zones(p_business_id uuid, p_search_term text DEFAULT NULL::text)
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
  
  -- If no business found or no delivery zones configured, return empty
  IF business_zones IS NULL OR jsonb_array_length(business_zones) = 0 THEN
    RETURN;
  END IF;
  
  -- For now, return users whose address contains any of the zone names
  -- This is a simplified matching - in production you'd want proper geographic matching
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
    -- If no search term, show all users in delivery zones
    p_search_term IS NULL OR
    LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE LOWER('%' || p_search_term || '%') OR
    LOWER(COALESCE(p.email, '')) LIKE LOWER('%' || p_search_term || '%') OR
    LOWER(COALESCE(p.phone, '')) LIKE LOWER('%' || p_search_term || '%')
  )
  AND (
    -- Check if user's address matches any delivery zone
    p.address IS NOT NULL AND
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(business_zones) AS zone
      WHERE LOWER(p.address) LIKE LOWER('%' || (zone->>'name') || '%')
      AND (zone->>'active')::boolean IS NOT FALSE
    )
    OR
    -- If no address specified, include all users for now
    p.address IS NULL
  )
  ORDER BY p.first_name, p.last_name
  LIMIT 50;
END;
$function$