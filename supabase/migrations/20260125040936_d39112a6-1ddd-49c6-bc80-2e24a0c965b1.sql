-- Table de suivi des soumissions IndexNow
CREATE TABLE public.indexnow_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  entity_type TEXT, -- 'product', 'business', 'fund', 'page'
  entity_id UUID,
  submitted_to TEXT[], -- ['bing', 'yandex']
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes de suivi
CREATE INDEX idx_indexnow_entity ON public.indexnow_submissions(entity_type, entity_id);
CREATE INDEX idx_indexnow_status ON public.indexnow_submissions(status, created_at DESC);
CREATE INDEX idx_indexnow_created ON public.indexnow_submissions(created_at DESC);

-- Commentaires pour documentation
COMMENT ON TABLE public.indexnow_submissions IS 'Tracks IndexNow URL submissions to search engines (Bing, Yandex)';
COMMENT ON COLUMN public.indexnow_submissions.url IS 'The URL submitted to IndexNow';
COMMENT ON COLUMN public.indexnow_submissions.entity_type IS 'Type of entity: product, business, fund, or page';
COMMENT ON COLUMN public.indexnow_submissions.submitted_to IS 'Array of search engines that accepted the submission';
COMMENT ON COLUMN public.indexnow_submissions.status IS 'Submission status: pending, success, or failed';

-- RLS - Allow service role to insert (edge functions)
ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;

-- Admins can view all submissions
CREATE POLICY "Admins can view indexnow submissions"
ON public.indexnow_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert indexnow submissions"
ON public.indexnow_submissions
FOR INSERT
WITH CHECK (true);