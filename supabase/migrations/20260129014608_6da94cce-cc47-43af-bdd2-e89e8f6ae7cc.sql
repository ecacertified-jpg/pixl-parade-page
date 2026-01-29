-- ============================================
-- SEO Sync Queue Table & Automatic Indexing Triggers
-- ============================================

-- Enable pg_net extension if not already enabled (required for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Table: seo_sync_queue
-- File d'attente pour la synchronisation SEO automatique
-- ============================================
CREATE TABLE IF NOT EXISTS public.seo_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'business', 'fund', 'page')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  url TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  metadata JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_seo_sync_queue_unprocessed 
ON public.seo_sync_queue (processed, priority, created_at) 
WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_seo_sync_queue_entity 
ON public.seo_sync_queue (entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.seo_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can access this table
CREATE POLICY "Admins can manage seo_sync_queue"
ON public.seo_sync_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- ============================================
-- Function: Queue SEO sync for products
-- ============================================
CREATE OR REPLACE FUNCTION public.queue_seo_sync_on_product_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync active products
  IF NEW.is_active = true THEN
    INSERT INTO seo_sync_queue (entity_type, entity_id, action, url, priority, metadata)
    VALUES (
      'product',
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'https://joiedevivre-africa.com/p/' || NEW.id,
      CASE 
        WHEN NEW.popularity_score IS NOT NULL AND NEW.popularity_score > 50 THEN 'high'
        ELSE 'normal' 
      END,
      jsonb_build_object(
        'name', NEW.name,
        'price', NEW.price,
        'business_id', NEW.business_id
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Auto-queue product changes
DROP TRIGGER IF EXISTS trigger_seo_sync_product ON products;
CREATE TRIGGER trigger_seo_sync_product
AFTER INSERT OR UPDATE OF name, price, description, image_url, is_active
ON products
FOR EACH ROW
EXECUTE FUNCTION queue_seo_sync_on_product_change();

-- ============================================
-- Function: Queue SEO sync for businesses
-- ============================================
CREATE OR REPLACE FUNCTION public.queue_seo_sync_on_business_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync active and approved businesses
  IF NEW.is_active = true AND NEW.status = 'approved' THEN
    INSERT INTO seo_sync_queue (entity_type, entity_id, action, url, priority, metadata)
    VALUES (
      'business',
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'https://joiedevivre-africa.com/b/' || NEW.id,
      'high', -- Businesses are always high priority
      jsonb_build_object(
        'name', NEW.business_name,
        'type', NEW.business_type,
        'country_code', NEW.country_code
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Auto-queue business changes
DROP TRIGGER IF EXISTS trigger_seo_sync_business ON business_accounts;
CREATE TRIGGER trigger_seo_sync_business
AFTER INSERT OR UPDATE OF business_name, description, logo_url, is_active, status
ON business_accounts
FOR EACH ROW
EXECUTE FUNCTION queue_seo_sync_on_business_change();

-- ============================================
-- Function: Queue SEO sync for collective funds
-- ============================================
CREATE OR REPLACE FUNCTION public.queue_seo_sync_on_fund_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync public funds that are not surprises
  IF NEW.is_public = true AND (NEW.is_surprise IS NULL OR NEW.is_surprise = false) THEN
    INSERT INTO seo_sync_queue (entity_type, entity_id, action, url, priority, metadata)
    VALUES (
      'fund',
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'https://joiedevivre-africa.com/f/' || NEW.id,
      'normal',
      jsonb_build_object(
        'title', NEW.title,
        'occasion', NEW.occasion,
        'target_amount', NEW.target_amount
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Auto-queue fund changes
DROP TRIGGER IF EXISTS trigger_seo_sync_fund ON collective_funds;
CREATE TRIGGER trigger_seo_sync_fund
AFTER INSERT OR UPDATE OF title, description, is_public, status
ON collective_funds
FOR EACH ROW
EXECUTE FUNCTION queue_seo_sync_on_fund_change();

-- ============================================
-- Table: seo_sync_stats
-- Statistics and last sync tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.seo_sync_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_type TEXT NOT NULL UNIQUE,
  stat_value JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial stats
INSERT INTO public.seo_sync_stats (stat_type, stat_value) 
VALUES 
  ('last_sync', '{"timestamp": null, "items_processed": 0}'::jsonb),
  ('daily_stats', '{"today": 0, "week": 0, "month": 0}'::jsonb),
  ('platform_stats', '{"products": 0, "businesses": 0, "funds": 0}'::jsonb)
ON CONFLICT (stat_type) DO NOTHING;

-- Enable RLS
ALTER TABLE public.seo_sync_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage, system can read
CREATE POLICY "Admins can manage seo_sync_stats"
ON public.seo_sync_stats
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- ============================================
-- Function: Get platform stats for SEO files
-- ============================================
CREATE OR REPLACE FUNCTION public.get_platform_seo_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'products_count', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'businesses_count', (SELECT COUNT(*) FROM business_accounts WHERE is_active = true AND status = 'approved'),
    'funds_count', (SELECT COUNT(*) FROM collective_funds WHERE is_public = true AND status = 'active'),
    'countries', ARRAY['CI', 'BJ', 'SN'],
    'last_updated', now()
  ) INTO result;
  
  RETURN result;
END;
$$;