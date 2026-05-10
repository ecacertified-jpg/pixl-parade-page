
-- 1. reciprocity_scores: restrict SELECT to the owner
DROP POLICY IF EXISTS "Authenticated users can view reciprocity scores" ON public.reciprocity_scores;

CREATE POLICY "Users can view their own reciprocity score"
ON public.reciprocity_scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reciprocity scores"
ON public.reciprocity_scores
FOR SELECT
TO authenticated
USING (public.is_active_admin(auth.uid()));

-- 2. admin_share_codes: drop bypassable public policy
DROP POLICY IF EXISTS "Public can validate active share codes" ON public.admin_share_codes;

-- 3. inactive_user_notifications: scope INSERT strictly to service_role
DROP POLICY IF EXISTS "Service role can insert" ON public.inactive_user_notifications;

CREATE POLICY "Service role can insert inactive notifications"
ON public.inactive_user_notifications
FOR INSERT
TO service_role
WITH CHECK (true);
