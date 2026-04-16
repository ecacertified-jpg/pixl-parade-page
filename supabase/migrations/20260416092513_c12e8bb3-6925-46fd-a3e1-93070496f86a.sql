
-- 1. notification_analytics: drop the dangerous ALL policy on public role
DROP POLICY IF EXISTS "Service role can manage notification analytics" ON public.notification_analytics;

-- Recreate for service_role only
CREATE POLICY "Service role manages notification analytics"
ON public.notification_analytics
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 2. business_waitlist: drop the USING(true) SELECT policy
DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.business_waitlist;

-- Recreate with user-scoped condition
CREATE POLICY "Users can view own waitlist entry"
ON public.business_waitlist
FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 3. business_accounts: drop the public SELECT that exposes email/phone
-- The codebase already uses business_public_info view for public access
DROP POLICY IF EXISTS "Public can view active businesses" ON public.business_accounts;

-- 4. profile_completion_reminders: drop public INSERT/UPDATE
DROP POLICY IF EXISTS "System can insert reminders" ON public.profile_completion_reminders;
DROP POLICY IF EXISTS "System can update reminders" ON public.profile_completion_reminders;

-- Recreate for service_role only
CREATE POLICY "Service role manages reminders"
ON public.profile_completion_reminders
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Users should be able to read their own reminders
CREATE POLICY "Users can view own reminders"
ON public.profile_completion_reminders
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. Storage: restrict business-gallery delete/update to owner
DROP POLICY IF EXISTS "Authenticated users can delete from business gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business gallery" ON storage.objects;

-- Recreate with ownership check: path must start with user's business_account id
CREATE POLICY "Business owners can update their gallery"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-gallery'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete from their gallery"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'business-gallery'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);
