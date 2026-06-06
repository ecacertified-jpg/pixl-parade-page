
-- Lot 3.1 — Wave subscription helpers: indexes + atomic confirmation function

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wave_req_status_created
  ON public.wave_subscription_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wave_req_user
  ON public.wave_subscription_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_user_subs_provider_period_end
  ON public.user_subscriptions (provider, current_period_end)
  WHERE status = 'active';

-- updated_at trigger on wave_subscription_requests
DROP TRIGGER IF EXISTS trg_wave_req_updated_at ON public.wave_subscription_requests;
CREATE TRIGGER trg_wave_req_updated_at
  BEFORE UPDATE ON public.wave_subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Atomic confirmation function: admin marks request as confirmed and activates the subscription.
CREATE OR REPLACE FUNCTION public.process_wave_confirmation(
  _request_id uuid,
  _admin_user_id uuid,
  _transaction_reference text DEFAULT NULL,
  _reviewer_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.wave_subscription_requests%ROWTYPE;
  v_is_admin boolean;
  v_period_end timestamptz;
  v_previous_tier subscription_plan_tier;
  v_sub_id uuid;
BEGIN
  -- Admin check
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _admin_user_id AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  -- Load request (lock row)
  SELECT * INTO v_req
  FROM public.wave_subscription_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wave subscription request not found: %', _request_id;
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', v_req.status;
  END IF;

  -- Compute period end based on billing cycle
  v_period_end := CASE
    WHEN v_req.billing_cycle = 'yearly' THEN now() + interval '365 days'
    ELSE now() + interval '30 days'
  END;

  -- Capture previous plan tier
  SELECT plan_tier INTO v_previous_tier
  FROM public.user_subscriptions
  WHERE user_id = v_req.user_id;

  IF v_previous_tier IS NULL THEN
    v_previous_tier := 'free'::subscription_plan_tier;
  END IF;

  -- Upsert subscription (1 row per user)
  INSERT INTO public.user_subscriptions (
    user_id, plan_tier, status, provider, billing_cycle, currency,
    current_period_start, current_period_end, cancel_at_period_end,
    canceled_at, metadata
  ) VALUES (
    v_req.user_id, v_req.plan_tier, 'active'::subscription_status, 'wave'::subscription_provider,
    v_req.billing_cycle, 'XOF',
    now(), v_period_end, false,
    NULL,
    jsonb_build_object('wave_request_id', v_req.id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_tier = EXCLUDED.plan_tier,
    status = 'active'::subscription_status,
    provider = 'wave'::subscription_provider,
    billing_cycle = EXCLUDED.billing_cycle,
    currency = 'XOF',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = false,
    canceled_at = NULL,
    metadata = public.user_subscriptions.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_sub_id;

  -- Mark request confirmed
  UPDATE public.wave_subscription_requests
  SET status = 'confirmed',
      reviewed_by = _admin_user_id,
      reviewed_at = now(),
      transaction_reference = COALESCE(_transaction_reference, transaction_reference),
      reviewer_notes = COALESCE(_reviewer_notes, reviewer_notes),
      updated_at = now()
  WHERE id = _request_id;

  -- Log event
  INSERT INTO public.subscription_events (
    user_id, subscription_id, event_type, from_plan, to_plan, provider, source, metadata
  ) VALUES (
    v_req.user_id, v_sub_id,
    CASE WHEN v_previous_tier = v_req.plan_tier THEN 'renewed'
         WHEN v_previous_tier = 'free' THEN 'created'
         ELSE 'upgraded' END,
    v_previous_tier, v_req.plan_tier, 'wave'::subscription_provider, 'admin_confirm',
    jsonb_build_object(
      'wave_request_id', v_req.id,
      'admin_user_id', _admin_user_id,
      'transaction_reference', _transaction_reference
    )
  );

  -- Create invoice
  INSERT INTO public.subscription_invoices (
    user_id, subscription_id, provider, external_id, amount, currency, status,
    paid_at, period_start, period_end, metadata
  ) VALUES (
    v_req.user_id, v_sub_id, 'wave'::subscription_provider, _transaction_reference,
    v_req.amount_xof, 'XOF', 'paid',
    now(), now(), v_period_end,
    jsonb_build_object('wave_request_id', v_req.id, 'billing_cycle', v_req.billing_cycle)
  );

  RETURN jsonb_build_object(
    'subscription_id', v_sub_id,
    'plan_tier', v_req.plan_tier,
    'current_period_end', v_period_end,
    'previous_plan', v_previous_tier
  );
END;
$$;

-- Admin rejection helper (atomic)
CREATE OR REPLACE FUNCTION public.process_wave_rejection(
  _request_id uuid,
  _admin_user_id uuid,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.wave_subscription_requests%ROWTYPE;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _admin_user_id AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  SELECT * INTO v_req
  FROM public.wave_subscription_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wave subscription request not found: %', _request_id;
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  UPDATE public.wave_subscription_requests
  SET status = 'rejected',
      reviewed_by = _admin_user_id,
      reviewed_at = now(),
      reviewer_notes = _reason,
      updated_at = now()
  WHERE id = _request_id;

  INSERT INTO public.subscription_events (
    user_id, event_type, provider, source, metadata
  ) VALUES (
    v_req.user_id, 'payment_failed', 'wave'::subscription_provider, 'admin_reject',
    jsonb_build_object('wave_request_id', v_req.id, 'reason', _reason, 'admin_user_id', _admin_user_id)
  );
END;
$$;

-- Wave subscription expiry function (used by cron)
CREATE OR REPLACE FUNCTION public.expire_wave_subscriptions()
RETURNS TABLE(expired_user_id uuid, previous_tier subscription_plan_tier)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, user_id, plan_tier
    FROM public.user_subscriptions
    WHERE provider = 'wave'::subscription_provider
      AND status = 'active'::subscription_status
      AND current_period_end IS NOT NULL
      AND current_period_end < now()
    FOR UPDATE
  LOOP
    UPDATE public.user_subscriptions
    SET plan_tier = 'free'::subscription_plan_tier,
        status = 'canceled'::subscription_status,
        canceled_at = now(),
        updated_at = now()
    WHERE id = r.id;

    INSERT INTO public.subscription_events (
      user_id, subscription_id, event_type, from_plan, to_plan, provider, source, metadata
    ) VALUES (
      r.user_id, r.id, 'expired', r.plan_tier, 'free'::subscription_plan_tier,
      'wave'::subscription_provider, 'cron', '{}'::jsonb
    );

    expired_user_id := r.user_id;
    previous_tier := r.plan_tier;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Unique index to enforce 1 subscription per user (for ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_subscriptions_user_id
  ON public.user_subscriptions (user_id);
