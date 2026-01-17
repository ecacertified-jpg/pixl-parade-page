-- Create business_gallery table for vendor media showcase
CREATE TABLE public.business_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_business_gallery_business_id ON public.business_gallery(business_id);
CREATE INDEX idx_business_gallery_order ON public.business_gallery(business_id, display_order);

-- Enable RLS
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active gallery items from active businesses
CREATE POLICY "Public can view active gallery items"
ON public.business_gallery FOR SELECT
USING (
  is_active = TRUE AND
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_id AND ba.is_active = TRUE
  )
);

-- Policy: Business owners can manage their own gallery
CREATE POLICY "Business owners can manage their gallery"
ON public.business_gallery FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_id AND ba.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_id AND ba.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_business_gallery_updated_at
BEFORE UPDATE ON public.business_gallery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();