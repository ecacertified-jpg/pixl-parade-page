-- Table pour les alertes d'anniversaire envoyées aux commerçants
CREATE TABLE public.business_birthday_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  target_user_name TEXT,
  target_user_avatar TEXT,
  days_until_birthday INTEGER NOT NULL,
  birthday_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'fund_created', 'dismissed', 'expired')),
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('normal', 'high', 'urgent', 'critical')),
  fund_id UUID REFERENCES public.collective_funds(id) ON DELETE SET NULL,
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(business_id, target_user_id, birthday_date)
);

-- Indexes pour les requêtes fréquentes
CREATE INDEX idx_business_birthday_alerts_business_id ON public.business_birthday_alerts(business_id);
CREATE INDEX idx_business_birthday_alerts_status ON public.business_birthday_alerts(status);
CREATE INDEX idx_business_birthday_alerts_priority ON public.business_birthday_alerts(priority);
CREATE INDEX idx_business_birthday_alerts_expires_at ON public.business_birthday_alerts(expires_at);

-- Enable RLS
ALTER TABLE public.business_birthday_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Commerçants ne voient que leurs propres alertes
CREATE POLICY "Business owners can view their own alerts"
ON public.business_birthday_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_id AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update their own alerts"
ON public.business_birthday_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_id AND ba.user_id = auth.uid()
  )
);

-- Admins et système peuvent tout faire
CREATE POLICY "System can manage all alerts"
ON public.business_birthday_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_business_birthday_alerts_updated_at
BEFORE UPDATE ON public.business_birthday_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();