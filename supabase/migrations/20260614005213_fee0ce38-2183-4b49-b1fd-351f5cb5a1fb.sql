CREATE TABLE IF NOT EXISTS public.event_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_pages(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.event_guests(id) ON DELETE CASCADE,
  milestone text NOT NULL CHECK (milestone IN ('J-30','J-7','J-1','J-0')),
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, guest_id, milestone)
);

CREATE INDEX IF NOT EXISTS event_reminder_log_event_idx ON public.event_reminder_log(event_id);

GRANT SELECT ON public.event_reminder_log TO authenticated;
GRANT ALL ON public.event_reminder_log TO service_role;

ALTER TABLE public.event_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event creators can read their reminder log"
ON public.event_reminder_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id = event_reminder_log.event_id
      AND ep.creator_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage reminder log"
ON public.event_reminder_log FOR ALL
TO service_role
USING (true) WITH CHECK (true);