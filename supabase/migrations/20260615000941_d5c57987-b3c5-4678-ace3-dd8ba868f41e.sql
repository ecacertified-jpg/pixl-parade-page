
-- Event AI checklist items
CREATE TABLE public.event_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_pages(id) ON DELETE CASCADE,
  task text NOT NULL,
  category text,
  due_offset_days integer,
  is_done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_checklist_event ON public.event_checklist_items(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_checklist_items TO authenticated;
GRANT ALL ON public.event_checklist_items TO service_role;

ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage checklist"
ON public.event_checklist_items FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.event_pages ep WHERE ep.id = event_id AND ep.creator_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.event_pages ep WHERE ep.id = event_id AND ep.creator_id = auth.uid()));

CREATE TRIGGER trg_event_checklist_updated_at
BEFORE UPDATE ON public.event_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
