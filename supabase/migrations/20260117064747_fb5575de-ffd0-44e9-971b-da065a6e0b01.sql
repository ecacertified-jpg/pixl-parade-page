-- Table pour enregistrer chaque partage de produit
CREATE TABLE public.product_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  share_platform TEXT NOT NULL CHECK (share_platform IN ('whatsapp', 'facebook', 'sms', 'email', 'native', 'copy_link')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes de comptage
CREATE INDEX idx_product_shares_product ON public.product_shares(product_id);
CREATE INDEX idx_product_shares_platform ON public.product_shares(share_platform);
CREATE INDEX idx_product_shares_created ON public.product_shares(created_at);

-- RLS
ALTER TABLE public.product_shares ENABLE ROW LEVEL SECURITY;

-- Tous peuvent insérer un partage (même anonyme)
CREATE POLICY "Anyone can record shares" ON public.product_shares
  FOR INSERT WITH CHECK (true);

-- Les propriétaires de produits peuvent voir les partages de leurs produits
CREATE POLICY "Product owners can view shares" ON public.product_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.business_owner_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all shares" ON public.product_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Vue pour les statistiques agrégées par produit
CREATE VIEW public.product_share_stats AS
SELECT 
  product_id,
  COUNT(*) as total_shares,
  COUNT(*) FILTER (WHERE share_platform = 'whatsapp') as whatsapp_shares,
  COUNT(*) FILTER (WHERE share_platform = 'facebook') as facebook_shares,
  COUNT(*) FILTER (WHERE share_platform = 'sms') as sms_shares,
  COUNT(*) FILTER (WHERE share_platform = 'email') as email_shares,
  COUNT(*) FILTER (WHERE share_platform = 'native') as native_shares,
  COUNT(*) FILTER (WHERE share_platform = 'copy_link') as link_copies,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as shares_this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as shares_today
FROM public.product_shares
GROUP BY product_id;