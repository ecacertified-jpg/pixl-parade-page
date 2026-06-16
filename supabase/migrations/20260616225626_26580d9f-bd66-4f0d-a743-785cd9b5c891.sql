
-- 1. card template ref on posts
ALTER TABLE public.celebration_posts
  ADD COLUMN IF NOT EXISTS card_template_id uuid REFERENCES public.birthday_card_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gifts_total_xof integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gifts_count integer NOT NULL DEFAULT 0;

-- 2. digital gifts table
CREATE TABLE IF NOT EXISTS public.celebration_digital_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.celebration_posts(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_user_id uuid,
  gift_key text NOT NULL,
  amount_xof integer NOT NULL DEFAULT 0,
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.celebration_digital_gifts TO anon;
GRANT SELECT, INSERT, DELETE ON public.celebration_digital_gifts TO authenticated;
GRANT ALL ON public.celebration_digital_gifts TO service_role;
ALTER TABLE public.celebration_digital_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Digital gifts public read"
  ON public.celebration_digital_gifts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can send digital gifts"
  ON public.celebration_digital_gifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Sender can delete own gift"
  ON public.celebration_digital_gifts FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_celebration_digital_gifts_post ON public.celebration_digital_gifts(post_id, created_at DESC);

-- counter trigger
CREATE OR REPLACE FUNCTION public.celebration_digital_gifts_count_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.celebration_posts
       SET gifts_count = gifts_count + 1,
           gifts_total_xof = gifts_total_xof + COALESCE(NEW.amount_xof, 0)
     WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.celebration_posts
       SET gifts_count = GREATEST(gifts_count - 1, 0),
           gifts_total_xof = GREATEST(gifts_total_xof - COALESCE(OLD.amount_xof, 0), 0)
     WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS celebration_digital_gifts_count_trg ON public.celebration_digital_gifts;
CREATE TRIGGER celebration_digital_gifts_count_trg
AFTER INSERT OR DELETE ON public.celebration_digital_gifts
FOR EACH ROW EXECUTE FUNCTION public.celebration_digital_gifts_count_fn();

-- 3. VIP subscriptions
CREATE TABLE IF NOT EXISTS public.celebration_vip_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'gold',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.celebration_vip_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.celebration_vip_subscriptions TO authenticated;
GRANT ALL ON public.celebration_vip_subscriptions TO service_role;
ALTER TABLE public.celebration_vip_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP public read"
  ON public.celebration_vip_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "User can create own VIP entry"
  ON public.celebration_vip_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own VIP entry"
  ON public.celebration_vip_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Premium orders (purchase log via Wave)
CREATE TABLE IF NOT EXISTS public.celebration_premium_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  post_id uuid REFERENCES public.celebration_posts(id) ON DELETE SET NULL,
  amount_xof integer NOT NULL,
  duration_hours integer,
  status text NOT NULL DEFAULT 'pending',
  wave_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind IN ('boost','vip_badge','premium_card','digital_gift')),
  CHECK (status IN ('pending','paid','activated','cancelled','refunded'))
);
GRANT SELECT, INSERT, UPDATE ON public.celebration_premium_orders TO authenticated;
GRANT ALL ON public.celebration_premium_orders TO service_role;
ALTER TABLE public.celebration_premium_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own orders"
  ON public.celebration_premium_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner creates own orders"
  ON public.celebration_premium_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner updates own orders"
  ON public.celebration_premium_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_celebration_premium_orders_user ON public.celebration_premium_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_celebration_premium_orders_status ON public.celebration_premium_orders(status);

DROP TRIGGER IF EXISTS celebration_premium_orders_updated_at_trg ON public.celebration_premium_orders;
CREATE TRIGGER celebration_premium_orders_updated_at_trg
BEFORE UPDATE ON public.celebration_premium_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS celebration_vip_subs_updated_at_trg ON public.celebration_vip_subscriptions;
CREATE TRIGGER celebration_vip_subs_updated_at_trg
BEFORE UPDATE ON public.celebration_vip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime for premium tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebration_digital_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebration_vip_subscriptions;
