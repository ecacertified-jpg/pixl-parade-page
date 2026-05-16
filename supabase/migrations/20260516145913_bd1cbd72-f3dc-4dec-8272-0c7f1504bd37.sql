
-- 1. Switch SECURITY DEFINER views to SECURITY INVOKER
ALTER VIEW public.admin_share_codes_public SET (security_invoker = true);
ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.contacts_limited SET (security_invoker = true);
ALTER VIEW public.product_rating_stats SET (security_invoker = true);
ALTER VIEW public.user_birthday_stats SET (security_invoker = true);
ALTER VIEW public.user_badges_with_definitions SET (security_invoker = true);
ALTER VIEW public.admin_sessions_safe SET (security_invoker = true);
ALTER VIEW public.transaction_verifications_safe SET (security_invoker = true);
ALTER VIEW public.fund_contributions_safe SET (security_invoker = true);
ALTER VIEW public.collective_funds_public SET (security_invoker = true);
ALTER VIEW public.deleted_businesses_with_admin SET (security_invoker = true);
ALTER VIEW public.product_share_stats SET (security_invoker = true);
ALTER VIEW public.product_share_analytics SET (security_invoker = true);
ALTER VIEW public.business_public_info SET (security_invoker = true);

-- 2. Add admin-only SELECT policies to RLS-enabled tables that lacked policies
-- (writes remain blocked for authenticated; only service role can write)
CREATE POLICY "Admins can read birthday page activity notifs"
  ON public.birthday_page_activity_notifs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can read admin fund notif log"
  ON public.admin_fund_notif_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 3. Fix mutable search_path on two functions
ALTER FUNCTION public.set_profile_country() SET search_path = public;
ALTER FUNCTION public.calculate_product_popularity_score(integer, integer, integer, numeric, integer, integer) SET search_path = public;
