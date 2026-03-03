
CREATE OR REPLACE FUNCTION public.get_business_fund_for_owner(p_fund_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_user_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM business_collective_funds bcf
    JOIN business_accounts ba ON ba.id = bcf.business_id
    WHERE bcf.fund_id = p_fund_id AND ba.user_id = v_user_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'fund', row_to_json(cf.*),
    'product', row_to_json(p.*),
    'beneficiary', (SELECT row_to_json(pr.*) FROM profiles pr WHERE pr.user_id = bcf.beneficiary_user_id),
    'contributors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', fc.id,
        'amount', fc.amount,
        'name', COALESCE(NULLIF(TRIM(CONCAT(pr2.first_name, ' ', pr2.last_name)), ''), 'Anonyme')
      ))
      FROM fund_contributions fc
      LEFT JOIN profiles pr2 ON pr2.user_id = fc.contributor_id
      WHERE fc.fund_id = p_fund_id
    ), '[]'::jsonb),
    'order', (
      SELECT row_to_json(bo.*)
      FROM business_orders bo
      WHERE bo.fund_id = p_fund_id
      LIMIT 1
    )
  ) INTO result
  FROM business_collective_funds bcf
  JOIN collective_funds cf ON cf.id = bcf.fund_id
  LEFT JOIN products p ON p.id = bcf.product_id
  WHERE bcf.fund_id = p_fund_id
  LIMIT 1;

  RETURN result;
END;
$$;
