-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.fund_activities_secure;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.fund_activities_secure AS
SELECT 
  id,
  fund_id,
  activity_type,
  amount,
  currency,
  created_at,
  metadata,
  CASE
    WHEN activity_type = 'contribution' THEN 
      public.mask_contributor_info(
        (SELECT p.first_name FROM public.profiles p WHERE p.user_id = fa.contributor_id),
        COALESCE((metadata ->> 'is_anonymous')::boolean, false)
      )
    ELSE message
  END AS message
FROM public.fund_activities fa;

-- Enable RLS on the view
ALTER VIEW public.fund_activities_secure ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the view - users can only see activities for funds they have access to
CREATE POLICY "Users can view fund activities for accessible funds"
ON public.fund_activities_secure
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

-- Grant appropriate permissions
GRANT SELECT ON public.fund_activities_secure TO authenticated;
GRANT SELECT ON public.fund_activities_secure TO anon;