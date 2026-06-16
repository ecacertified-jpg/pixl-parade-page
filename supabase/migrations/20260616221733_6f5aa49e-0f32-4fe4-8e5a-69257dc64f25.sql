
CREATE TABLE IF NOT EXISTS public.event_urgent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  event_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_urgent_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_urgent_messages TO authenticated;
GRANT ALL ON public.event_urgent_messages TO service_role;

ALTER TABLE public.event_urgent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "urgent_msg_select_public" ON public.event_urgent_messages
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND (event_at IS NULL OR event_at > now()));

CREATE POLICY "urgent_msg_insert_managers" ON public.event_urgent_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'admin'::public.organizer_role));

CREATE POLICY "urgent_msg_update_managers" ON public.event_urgent_messages
  FOR UPDATE TO authenticated
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'admin'::public.organizer_role))
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'admin'::public.organizer_role));

CREATE POLICY "urgent_msg_delete_managers" ON public.event_urgent_messages
  FOR DELETE TO authenticated
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'admin'::public.organizer_role));

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_urgent_messages_active_unique
  ON public.event_urgent_messages(page_type, page_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_event_urgent_messages_page
  ON public.event_urgent_messages(page_type, page_id);

CREATE TRIGGER update_event_urgent_messages_updated_at
  BEFORE UPDATE ON public.event_urgent_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
