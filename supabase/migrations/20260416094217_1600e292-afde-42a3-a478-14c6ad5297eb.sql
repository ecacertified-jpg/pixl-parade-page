
-- ============================================================
-- SECURITY HARDENING BATCH 2
-- ============================================================

-- 1. og_image_cache_metadata: fix ALL policy from public to service_role
DROP POLICY IF EXISTS "Service role can manage cache metadata" ON public.og_image_cache_metadata;
CREATE POLICY "Service role manages cache metadata"
ON public.og_image_cache_metadata FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 2. profiles: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view profiles based on privacy" ON public.profiles;
CREATE POLICY "Users can view profiles based on privacy"
ON public.profiles FOR SELECT TO authenticated
USING (
  (is_deleted IS NULL OR is_deleted = false)
  AND (
    auth.uid() = user_id
    OR privacy_setting = 'public'
    OR (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM public.user_follows
      WHERE follower_id = auth.uid() AND following_id = profiles.user_id
    ))
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- 3. platform_settings: drop broad SELECT, create RPC for public settings
DROP POLICY IF EXISTS "Authenticated users can view platform settings" ON public.platform_settings;

-- RPC to read non-sensitive settings (price_markup_rate, video_duration_limits, free_delivery_threshold, commission_rate)
CREATE OR REPLACE FUNCTION public.get_public_platform_setting(p_key text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = p_key
    AND setting_key IN (
      'price_markup_rate',
      'video_duration_limits',
      'free_delivery_threshold',
      'commission_rate'
    );
$$;

-- 4. Admin/system INSERT policies: restrict to service_role
-- admin_growth_alerts
DROP POLICY IF EXISTS "System can insert growth alerts" ON public.admin_growth_alerts;
CREATE POLICY "Service role inserts growth alerts"
ON public.admin_growth_alerts FOR INSERT TO service_role
WITH CHECK (true);

-- admin_report_logs
DROP POLICY IF EXISTS "System can insert report logs" ON public.admin_report_logs;
CREATE POLICY "Service role inserts report logs"
ON public.admin_report_logs FOR INSERT TO service_role
WITH CHECK (true);

-- business_performance_alerts
DROP POLICY IF EXISTS "System can insert performance alerts" ON public.business_performance_alerts;
CREATE POLICY "Service role inserts performance alerts"
ON public.business_performance_alerts FOR INSERT TO service_role
WITH CHECK (true);

-- country_objective_alerts
DROP POLICY IF EXISTS "System can insert objective alerts" ON public.country_objective_alerts;
CREATE POLICY "Service role inserts objective alerts"
ON public.country_objective_alerts FOR INSERT TO service_role
WITH CHECK (true);

-- reciprocity_imbalance_alerts
DROP POLICY IF EXISTS "System can insert imbalance alerts" ON public.reciprocity_imbalance_alerts;
CREATE POLICY "Service role inserts imbalance alerts"
ON public.reciprocity_imbalance_alerts FOR INSERT TO service_role
WITH CHECK (true);

-- 5. Fix search_path on 9 security definer functions
ALTER FUNCTION public.is_active_admin SET search_path = public;
ALTER FUNCTION public.notify_admin_new_business SET search_path = public;
ALTER FUNCTION public.notify_admin_new_client SET search_path = public;
ALTER FUNCTION public.notify_admin_new_order SET search_path = public;
ALTER FUNCTION public.notify_admin_refund_request SET search_path = public;
ALTER FUNCTION public.notify_business_on_new_order SET search_path = public;
ALTER FUNCTION public.trigger_update_metrics_on_favorite SET search_path = public;
ALTER FUNCTION public.trigger_update_metrics_on_view SET search_path = public;
ALTER FUNCTION public.update_product_metrics SET search_path = public;

-- 6. whatsapp_otp_codes: service_role only
CREATE POLICY "Service role manages OTP codes"
ON public.whatsapp_otp_codes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 7. shortened_urls: public SELECT, service_role ALL
CREATE POLICY "Anyone can read shortened URLs"
ON public.shortened_urls FOR SELECT TO public USING (true);
CREATE POLICY "Service role manages shortened URLs"
ON public.shortened_urls FOR ALL TO service_role
USING (true) WITH CHECK (true);
