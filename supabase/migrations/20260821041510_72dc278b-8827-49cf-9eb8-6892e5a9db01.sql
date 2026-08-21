
-- 1. CRM ID sequence
CREATE SEQUENCE IF NOT EXISTS public.crm_id_seq START 1;

-- 2. crm_profiles
CREATE TABLE public.crm_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  crm_id TEXT NOT NULL UNIQUE DEFAULT ('JDV-' || lpad(nextval('public.crm_id_seq')::text, 6, '0')),
  statut_reactivation TEXT NOT NULL DEFAULT 'Non traité',
  statut_doublon TEXT NOT NULL DEFAULT 'Unique',
  admin_notes TEXT,
  assigned_admin_id UUID,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.crm_profiles TO authenticated;
GRANT ALL ON public.crm_profiles TO service_role;
GRANT USAGE ON SEQUENCE public.crm_id_seq TO authenticated, service_role;

ALTER TABLE public.crm_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view crm profiles"
ON public.crm_profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admins can insert crm profiles"
ON public.crm_profiles FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admins can update crm profiles"
ON public.crm_profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE INDEX idx_crm_profiles_user_id ON public.crm_profiles(user_id);

-- 3. crm_reactivation_history
CREATE TABLE public.crm_reactivation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_profile_id UUID REFERENCES public.crm_profiles(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canal TEXT,
  campagne TEXT,
  message TEXT,
  statut TEXT,
  reponse TEXT,
  action_suivante TEXT,
  resultat TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_reactivation_history TO authenticated;
GRANT ALL ON public.crm_reactivation_history TO service_role;

ALTER TABLE public.crm_reactivation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view crm history"
ON public.crm_reactivation_history FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admins can insert crm history"
ON public.crm_reactivation_history FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admins can update crm history"
ON public.crm_reactivation_history FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE INDEX idx_crm_history_user_id ON public.crm_reactivation_history(user_id);

-- 4. crm_scoring_rules
CREATE TABLE public.crm_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_scoring_rules TO authenticated;
GRANT ALL ON public.crm_scoring_rules TO service_role;

ALTER TABLE public.crm_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view crm scoring rules"
ON public.crm_scoring_rules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Super admins can manage crm scoring rules"
ON public.crm_scoring_rules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true AND au.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true AND au.role = 'super_admin'));

INSERT INTO public.crm_scoring_rules (rule_key, label, points, sort_order) VALUES
  ('birthday_soon', 'Anniversaire dans les 30 jours', 30, 1),
  ('page_created', 'Page déjà créée', 25, 2),
  ('recent_activity', 'Activité récente (30 jours)', 20, 3),
  ('fund_created', 'Cagnotte déjà créée', 15, 4),
  ('page_shared', 'Page déjà partagée', 10, 5),
  ('recent_interaction', 'Interaction récente avec JDV', 10, 6),
  ('inactive_30', 'Aucune activité depuis 30 jours', -10, 7),
  ('inactive_90', 'Aucune activité depuis 90 jours', -20, 8);

-- 5. updated_at triggers
CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_profiles_updated_at BEFORE UPDATE ON public.crm_profiles
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();
CREATE TRIGGER trg_crm_history_updated_at BEFORE UPDATE ON public.crm_reactivation_history
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();
CREATE TRIGGER trg_crm_rules_updated_at BEFORE UPDATE ON public.crm_scoring_rules
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

-- 6. Read-only aggregation view (service_role only; read through the admin-crm edge function)
CREATE VIEW public.crm_user_overview AS
SELECT
  p.user_id,
  p.first_name,
  p.last_name,
  p.phone,
  u.email,
  p.country_code,
  p.city,
  p.created_at AS signup_date,
  p.birthday,
  p.is_suspended,
  p.is_deleted,
  p.onboarding_completed,
  p.onboarding_furthest_step,
  u.last_sign_in_at,
  bp.slug            AS birthday_page_slug,
  bp.created_at      AS birthday_page_created_at,
  bp.published_at    AS birthday_page_published_at,
  bp.is_active       AS birthday_page_active,
  ep.slug            AS event_page_slug,
  ep.occasion        AS event_page_occasion,
  ep.event_date      AS event_page_date,
  ep.created_at      AS event_page_created_at,
  ep.is_active       AS event_page_active,
  COALESCE(f.funds_count, 0)            AS funds_count,
  COALESCE(f.active_funds_count, 0)     AS active_funds_count,
  f.first_fund_created_at,
  COALESCE(f.total_collected, 0)        AS total_collected,
  COALESCE(f.contributions_count, 0)    AS contributions_count,
  COALESCE(sh.shares_count, 0)          AS shares_count,
  sh.last_share_at,
  sh.share_channels,
  COALESCE(ob.onboarding_shares_count, 0) AS onboarding_shares_count,
  COALESCE(msg.messages_received, 0)    AS messages_received,
  COALESCE(pv.page_photo_views, 0)      AS page_photo_views,
  COALESCE(s.sessions_count, 0)         AS sessions_count,
  s.last_session_at,
  GREATEST(
    COALESCE(u.last_sign_in_at, p.created_at),
    COALESCE(s.last_session_at, p.created_at)
  ) AS last_activity_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
LEFT JOIN LATERAL (
  SELECT b.slug, b.created_at, b.published_at, b.is_active
  FROM public.birthday_pages b
  WHERE b.user_id = p.user_id
  ORDER BY b.celebration_year DESC NULLS LAST, b.created_at DESC
  LIMIT 1
) bp ON true
LEFT JOIN LATERAL (
  SELECT e.slug, e.occasion, e.event_date, e.created_at, e.is_active
  FROM public.event_pages e
  WHERE e.creator_id = p.user_id
  ORDER BY e.created_at DESC
  LIMIT 1
) ep ON true
LEFT JOIN LATERAL (
  SELECT
    count(*)::int AS funds_count,
    count(*) FILTER (WHERE cf.status = 'active')::int AS active_funds_count,
    min(cf.created_at) AS first_fund_created_at,
    COALESCE(sum(cf.current_amount), 0) AS total_collected,
    COALESCE(sum((SELECT count(*) FROM public.fund_contributions fc WHERE fc.fund_id = cf.id)), 0)::int AS contributions_count
  FROM public.collective_funds cf
  WHERE cf.creator_id = p.user_id OR cf.beneficiary_user_id = p.user_id
) f ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS shares_count,
         max(v.created_at) AS last_share_at,
         array_agg(DISTINCT v.channel) FILTER (WHERE v.channel IS NOT NULL) AS share_channels
  FROM public.viral_share_events v
  WHERE v.sharer_user_id = p.user_id
) sh ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS onboarding_shares_count
  FROM public.onboarding_shares o
  WHERE o.user_id = p.user_id
) ob ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS messages_received
  FROM public.birthday_wishes_messages m
  WHERE m.birthday_user_id = p.user_id
) msg ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS page_photo_views
  FROM public.birthday_page_photo_views pvw
  JOIN public.birthday_page_photos ph ON ph.id = pvw.photo_id
  JOIN public.birthday_pages bpp ON bpp.id = ph.birthday_page_id
  WHERE bpp.user_id = p.user_id
) pv ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS sessions_count, max(COALESCE(l.last_active_at, l.started_at)) AS last_session_at
  FROM public.user_session_logs l
  WHERE l.user_id = p.user_id
) s ON true;

REVOKE ALL ON public.crm_user_overview FROM anon, authenticated;
GRANT SELECT ON public.crm_user_overview TO service_role;
