-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.fund_activities_secure;

-- Recreate the view without SECURITY DEFINER, relying on underlying table RLS
CREATE VIEW public.fund_activities_secure AS
SELECT 
  fa.id,
  fa.fund_id,
  fa.activity_type,
  fa.amount,
  fa.currency,
  fa.created_at,
  fa.metadata,
  CASE
    WHEN fa.activity_type = 'contribution' THEN 
      public.mask_contributor_info(
        (SELECT p.first_name FROM public.profiles p WHERE p.user_id = fa.contributor_id),
        COALESCE((fa.metadata ->> 'is_anonymous')::boolean, false)
      )
    ELSE fa.message
  END AS message
FROM public.fund_activities fa;

-- Ensure the underlying fund_activities table has proper RLS
ALTER TABLE public.fund_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for fund_activities table if it doesn't exist
DROP POLICY IF EXISTS "Users can view fund activities for accessible funds" ON public.fund_activities;
CREATE POLICY "Users can view fund activities for accessible funds"
ON public.fund_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_id
    AND (
      cf.creator_id = auth.uid() OR 
      cf.is_public = true OR
      EXISTS (
        SELECT 1 FROM public.fund_contributions fc 
        WHERE fc.fund_id = cf.id AND fc.contributor_id = auth.uid()
      )
    )
  )
);

-- Grant appropriate permissions on the view
GRANT SELECT ON public.fund_activities_secure TO authenticated;
GRANT SELECT ON public.fund_activities_secure TO anon;