-- Table pour stocker les partages de boutiques
CREATE TABLE public.business_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  share_platform TEXT NOT NULL CHECK (share_platform IN ('whatsapp', 'facebook', 'sms', 'email', 'copy', 'native', 'other')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  
  -- Contexte du partage
  user_agent TEXT,
  referrer_url TEXT,
  
  -- Métriques de performance
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  follow_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  total_order_value NUMERIC(12,2) DEFAULT 0,
  
  -- Timestamps
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  first_follow_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table pour tracker chaque événement
CREATE TABLE public.business_share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.business_shares(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'view', 'follow', 'order', 'product_view')),
  
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contexte
  user_agent TEXT,
  device_type TEXT,
  referrer_url TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Valeur de conversion
  conversion_value NUMERIC(12,2),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les performances
CREATE INDEX idx_business_shares_business ON business_shares(business_id);
CREATE INDEX idx_business_shares_user ON business_shares(user_id);
CREATE INDEX idx_business_shares_token ON business_shares(share_token);
CREATE INDEX idx_business_shares_platform ON business_shares(share_platform);
CREATE INDEX idx_business_shares_created ON business_shares(created_at);

CREATE INDEX idx_business_share_events_share ON business_share_events(share_id);
CREATE INDEX idx_business_share_events_business ON business_share_events(business_id);
CREATE INDEX idx_business_share_events_type ON business_share_events(event_type);
CREATE INDEX idx_business_share_events_created ON business_share_events(created_at);

-- Fonction pour incrémenter les métriques
CREATE OR REPLACE FUNCTION increment_business_share_metrics(
  p_share_id UUID,
  p_event_type TEXT,
  p_conversion_value NUMERIC DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE business_shares
  SET
    click_count = CASE WHEN p_event_type = 'click' THEN click_count + 1 ELSE click_count END,
    view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
    follow_count = CASE WHEN p_event_type = 'follow' THEN follow_count + 1 ELSE follow_count END,
    order_count = CASE WHEN p_event_type = 'order' THEN order_count + 1 ELSE order_count END,
    total_order_value = total_order_value + COALESCE(p_conversion_value, 0),
    first_clicked_at = CASE WHEN p_event_type = 'click' AND first_clicked_at IS NULL THEN NOW() ELSE first_clicked_at END,
    last_clicked_at = CASE WHEN p_event_type = 'click' THEN NOW() ELSE last_clicked_at END,
    first_follow_at = CASE WHEN p_event_type = 'follow' AND first_follow_at IS NULL THEN NOW() ELSE first_follow_at END
  WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS pour business_shares
ALTER TABLE business_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their shares"
ON business_shares FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_accounts ba
    WHERE ba.id = business_shares.business_id
    AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create shares"
ON business_shares FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own shares"
ON business_shares FOR SELECT
USING (user_id = auth.uid());

-- RLS pour business_share_events
ALTER TABLE business_share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
ON business_share_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can view events"
ON business_share_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_accounts ba
    WHERE ba.id = business_share_events.business_id
    AND ba.user_id = auth.uid()
  )
);