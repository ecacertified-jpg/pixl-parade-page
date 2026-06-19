
CREATE TABLE public.viral_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','tiktok','clipboard','native','card','video','facebook','x','instagram')),
  page_type text NOT NULL CHECK (page_type IN ('birthday','event','profile','fund')),
  page_id uuid,
  page_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.viral_share_events TO authenticated;
GRANT INSERT ON public.viral_share_events TO anon;
GRANT ALL ON public.viral_share_events TO service_role;

ALTER TABLE public.viral_share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a share event"
  ON public.viral_share_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sharers can read their own events"
  ON public.viral_share_events FOR SELECT
  USING (sharer_user_id = auth.uid());

CREATE INDEX viral_share_events_page_idx
  ON public.viral_share_events (page_type, page_id, created_at DESC);
CREATE INDEX viral_share_events_created_idx
  ON public.viral_share_events (created_at DESC);

CREATE OR REPLACE VIEW public.viral_trending_pages AS
SELECT
  page_type,
  page_id,
  page_slug,
  COUNT(*)::int AS share_count_7d,
  MAX(created_at) AS last_shared_at
FROM public.viral_share_events
WHERE created_at > now() - interval '7 days'
  AND page_id IS NOT NULL
GROUP BY page_type, page_id, page_slug;

GRANT SELECT ON public.viral_trending_pages TO anon, authenticated;
