-- Enrichir la table product_shares avec les colonnes de tracking
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex');
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS template_used TEXT DEFAULT 'classic';
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS personal_message TEXT;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS total_conversion_value NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS first_clicked_at TIMESTAMPTZ;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ;
ALTER TABLE public.product_shares ADD COLUMN IF NOT EXISTS first_converted_at TIMESTAMPTZ;

-- Créer la table product_share_events pour tracker chaque événement
CREATE TABLE IF NOT EXISTS public.product_share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.product_shares(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'view', 'add_to_cart', 'purchase', 'share_again')),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  device_type TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  conversion_value NUMERIC(12,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les analyses
CREATE INDEX IF NOT EXISTS idx_share_events_share ON public.product_share_events(share_id);
CREATE INDEX IF NOT EXISTS idx_share_events_product ON public.product_share_events(product_id);
CREATE INDEX IF NOT EXISTS idx_share_events_type ON public.product_share_events(event_type);
CREATE INDEX IF NOT EXISTS idx_share_events_date ON public.product_share_events(created_at);
CREATE INDEX IF NOT EXISTS idx_product_shares_token ON public.product_shares(share_token);

-- Enable RLS on product_share_events
ALTER TABLE public.product_share_events ENABLE ROW LEVEL SECURITY;

-- Policies pour product_share_events
CREATE POLICY "Anyone can insert share events"
ON public.product_share_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view events for their shares"
ON public.product_share_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_shares ps
    WHERE ps.id = product_share_events.share_id
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can view events for their products"
ON public.product_share_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.business_accounts ba ON ba.id = p.business_id
    WHERE p.id = product_share_events.product_id
    AND ba.user_id = auth.uid()
  )
);

-- Vue analytique pour les statistiques agrégées
CREATE OR REPLACE VIEW public.product_share_analytics AS
SELECT 
  ps.product_id,
  ps.share_platform,
  COUNT(DISTINCT ps.id) as total_shares,
  COALESCE(SUM(ps.click_count), 0) as total_clicks,
  COALESCE(SUM(ps.view_count), 0) as total_views,
  COALESCE(SUM(ps.conversion_count), 0) as total_conversions,
  COALESCE(SUM(ps.total_conversion_value), 0) as total_revenue,
  CASE WHEN COALESCE(SUM(ps.click_count), 0) > 0 
    THEN ROUND(COALESCE(SUM(ps.conversion_count), 0)::numeric / SUM(ps.click_count) * 100, 2)
    ELSE 0 
  END as click_to_conversion_rate,
  CASE WHEN COUNT(ps.id) > 0 
    THEN ROUND(SUM(CASE WHEN ps.click_count > 0 THEN 1 ELSE 0 END)::numeric / COUNT(ps.id) * 100, 2)
    ELSE 0 
  END as share_to_click_rate,
  CASE WHEN COALESCE(SUM(ps.conversion_count), 0) > 0 
    THEN ROUND(SUM(ps.total_conversion_value) / SUM(ps.conversion_count), 2)
    ELSE 0 
  END as avg_conversion_value
FROM public.product_shares ps
GROUP BY ps.product_id, ps.share_platform;

-- Fonction pour incrémenter les compteurs de partage
CREATE OR REPLACE FUNCTION public.increment_share_metrics(
  p_share_token TEXT,
  p_event_type TEXT,
  p_conversion_value NUMERIC DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_type = 'click' THEN
    UPDATE product_shares
    SET 
      click_count = click_count + 1,
      first_clicked_at = COALESCE(first_clicked_at, NOW()),
      last_clicked_at = NOW()
    WHERE share_token = p_share_token;
  ELSIF p_event_type = 'view' THEN
    UPDATE product_shares
    SET view_count = view_count + 1
    WHERE share_token = p_share_token;
  ELSIF p_event_type IN ('purchase', 'add_to_cart') THEN
    UPDATE product_shares
    SET 
      conversion_count = conversion_count + 1,
      total_conversion_value = total_conversion_value + COALESCE(p_conversion_value, 0),
      first_converted_at = COALESCE(first_converted_at, NOW())
    WHERE share_token = p_share_token;
  END IF;
END;
$$;