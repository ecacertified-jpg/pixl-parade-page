
-- =========================================================
-- LOT 1 — SOCLE ABONNEMENTS SAAS
-- =========================================================

-- 1. Types
DO $$ BEGIN
  CREATE TYPE public.subscription_plan_tier AS ENUM ('free', 'essentiel', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active', 'canceled', 'past_due', 'awaiting_payment', 'incomplete'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_provider AS ENUM ('stripe', 'wave', 'admin_override');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Catalogue des plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.subscription_plan_tier NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  price_eur_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_eur_yearly numeric(10,2) NOT NULL DEFAULT 0,
  price_xof_monthly numeric(12,0) NOT NULL DEFAULT 0,
  price_xof_yearly numeric(12,0) NOT NULL DEFAULT 0,
  stripe_price_monthly_eur text,
  stripe_price_yearly_eur text,
  stripe_price_monthly_xof text,
  stripe_price_yearly_xof text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_public_read"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- 3. Abonnement utilisateur
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_tier public.subscription_plan_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  provider public.subscription_provider,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  currency text NOT NULL DEFAULT 'EUR',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  trial_ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON public.user_subscriptions(stripe_subscription_id);

GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_owner_read"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Pas d'INSERT/UPDATE/DELETE côté authenticated : géré par edge functions (service_role)

-- 4. Journal d'événements
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  from_plan public.subscription_plan_tier,
  to_plan public.subscription_plan_tier,
  provider public.subscription_provider,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON public.subscription_events(user_id, created_at DESC);

GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_events_owner_read"
  ON public.subscription_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. Factures
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  provider public.subscription_provider NOT NULL,
  external_id text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  hosted_invoice_url text,
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.subscription_invoices(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_provider_external
  ON public.subscription_invoices(provider, external_id)
  WHERE external_id IS NOT NULL;

GRANT SELECT ON public.subscription_invoices TO authenticated;
GRANT ALL ON public.subscription_invoices TO service_role;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_invoices_owner_read"
  ON public.subscription_invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 6. Compteurs mensuels d'usage
CREATE TABLE IF NOT EXISTS public.feature_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  period_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  used_value bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_usage_unique UNIQUE (user_id, feature_key, period_month)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_period ON public.feature_usage_counters(user_id, period_month);

GRANT SELECT ON public.feature_usage_counters TO authenticated;
GRANT ALL ON public.feature_usage_counters TO service_role;
ALTER TABLE public.feature_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_usage_owner_read"
  ON public.feature_usage_counters FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 7. Demandes Wave en attente
CREATE TABLE IF NOT EXISTS public.wave_subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_tier public.subscription_plan_tier NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  amount_xof numeric(12,0) NOT NULL,
  wave_link text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','expired')),
  transaction_reference text,
  proof_url text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wave_req_user ON public.wave_subscription_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wave_req_status ON public.wave_subscription_requests(status);

GRANT SELECT, INSERT ON public.wave_subscription_requests TO authenticated;
GRANT ALL ON public.wave_subscription_requests TO service_role;
ALTER TABLE public.wave_subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wave_req_owner_read"
  ON public.wave_subscription_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true)
  );

CREATE POLICY "wave_req_owner_insert"
  ON public.wave_subscription_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "wave_req_admin_update"
  ON public.wave_subscription_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true));

-- 8. Override admin (promo, VIP)
CREATE TABLE IF NOT EXISTS public.plan_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_tier public.subscription_plan_tier NOT NULL,
  reason text NOT NULL,
  granted_by uuid NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_overrides_user_active
  ON public.plan_overrides(user_id) WHERE is_active = true;

GRANT SELECT ON public.plan_overrides TO authenticated;
GRANT ALL ON public.plan_overrides TO service_role;
ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_overrides_owner_read"
  ON public.plan_overrides FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true)
  );

CREATE POLICY "plan_overrides_admin_write"
  ON public.plan_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active = true));

-- =========================================================
-- 9. HELPERS SQL
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS public.subscription_plan_tier
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan public.subscription_plan_tier;
BEGIN
  -- Override actif prioritaire
  SELECT plan_tier INTO v_plan
  FROM public.plan_overrides
  WHERE user_id = _user_id
    AND is_active = true
    AND starts_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY
    CASE plan_tier WHEN 'premium' THEN 3 WHEN 'essentiel' THEN 2 ELSE 1 END DESC
  LIMIT 1;
  IF v_plan IS NOT NULL THEN RETURN v_plan; END IF;

  -- Sinon abonnement actif
  SELECT plan_tier INTO v_plan
  FROM public.user_subscriptions
  WHERE user_id = _user_id
    AND status IN ('active','past_due')
    AND (current_period_end IS NULL OR current_period_end > now())
  LIMIT 1;

  RETURN COALESCE(v_plan, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_plan_limit(_tier public.subscription_plan_tier, _feature_key text)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF((limits ->> _feature_key), '')::bigint,
    0
  )
  FROM public.subscription_plans
  WHERE tier = _tier;
$$;

-- Limite -1 = illimité
CREATE OR REPLACE FUNCTION public.can_create_resource(_user_id uuid, _feature_key text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier public.subscription_plan_tier;
  v_limit bigint;
  v_used bigint;
BEGIN
  v_tier := public.get_user_plan(_user_id);
  v_limit := public.get_plan_limit(v_tier, _feature_key);
  IF v_limit = -1 THEN RETURN true; END IF;
  IF v_limit = 0 THEN RETURN false; END IF;

  SELECT COALESCE(used_value, 0) INTO v_used
  FROM public.feature_usage_counters
  WHERE user_id = _user_id
    AND feature_key = _feature_key
    AND period_month = date_trunc('month', now())::date;

  RETURN COALESCE(v_used, 0) < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _feature_key text, _delta bigint DEFAULT 1)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new bigint;
BEGIN
  INSERT INTO public.feature_usage_counters (user_id, feature_key, period_month, used_value)
  VALUES (_user_id, _feature_key, date_trunc('month', now())::date, GREATEST(_delta, 0))
  ON CONFLICT (user_id, feature_key, period_month)
  DO UPDATE SET used_value = feature_usage_counters.used_value + _delta,
                updated_at = now()
  RETURNING used_value INTO v_new;
  RETURN v_new;
END;
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_sub_plans_touch ON public.subscription_plans;
CREATE TRIGGER trg_sub_plans_touch BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_user_sub_touch ON public.user_subscriptions;
CREATE TRIGGER trg_user_sub_touch BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_wave_req_touch ON public.wave_subscription_requests;
CREATE TRIGGER trg_wave_req_touch BEFORE UPDATE ON public.wave_subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_usage_touch ON public.feature_usage_counters;
CREATE TRIGGER trg_usage_touch BEFORE UPDATE ON public.feature_usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- 10. SEED DES 3 PLANS
-- =========================================================
INSERT INTO public.subscription_plans
  (tier, name, tagline, description,
   price_eur_monthly, price_eur_yearly, price_xof_monthly, price_xof_yearly,
   features, limits, sort_order)
VALUES
  ('free', 'Gratuit', 'Célèbre les tiens, simplement.',
   'Pour découvrir JDV et célébrer un proche.',
   0, 0, 0, 0,
   '{"premium_themes": false, "hd_video": false, "album_export": false, "priority_support": false, "ad_free": false, "public_badge": false}'::jsonb,
   '{"event_pages": 1, "album_photos_per_page": 20, "active_funds": 1, "wishes_displayed": 50, "guests_per_page": 30, "storage_mb": 500, "co_organizers": 0, "ai_recommendations": 5, "fund_commission_rate": 5}'::jsonb,
   1),
  ('essentiel', 'Essentiel', 'Crée des célébrations qui marquent.',
   'Pour celles et ceux qui célèbrent souvent leurs proches.',
   4.99, 49.00, 3200, 32000,
   '{"premium_themes": false, "hd_video": "720p", "album_export": "pdf", "priority_support": "email_48h", "ad_free": "reduced", "public_badge": "essentiel"}'::jsonb,
   '{"event_pages": 5, "album_photos_per_page": 100, "active_funds": 3, "wishes_displayed": 200, "guests_per_page": 150, "storage_mb": 5120, "co_organizers": 2, "ai_recommendations": 30, "fund_commission_rate": 3}'::jsonb,
   2),
  ('premium', 'Premium', 'Inoubliable. Sans limite. Reconnu.',
   'L''expérience JDV complète : pages illimitées, souvenirs sans fin, badge doré.',
   12.99, 129.00, 8500, 85000,
   '{"premium_themes": true, "hd_video": "1080p", "album_export": "pdf_and_video", "priority_support": "whatsapp_24h", "ad_free": true, "public_badge": "premium_gold", "exclusive_themes": true, "profile_halo": true}'::jsonb,
   '{"event_pages": -1, "album_photos_per_page": -1, "active_funds": -1, "wishes_displayed": -1, "guests_per_page": -1, "storage_mb": 51200, "co_organizers": 10, "ai_recommendations": -1, "fund_commission_rate": 0}'::jsonb,
   3)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_eur_monthly = EXCLUDED.price_eur_monthly,
  price_eur_yearly = EXCLUDED.price_eur_yearly,
  price_xof_monthly = EXCLUDED.price_xof_monthly,
  price_xof_yearly = EXCLUDED.price_xof_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
