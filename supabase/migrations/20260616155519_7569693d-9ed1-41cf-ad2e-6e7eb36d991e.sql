
CREATE TABLE IF NOT EXISTS public.event_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 8 CHECK (capacity > 0 AND capacity <= 50),
  shape text NOT NULL DEFAULT 'round' CHECK (shape IN ('round','rect','square')),
  position_x numeric NOT NULL DEFAULT 0,
  position_y numeric NOT NULL DEFAULT 0,
  color text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tables TO authenticated;
GRANT ALL ON public.event_tables TO service_role;

ALTER TABLE public.event_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables_select_managers" ON public.event_tables
  FOR SELECT TO authenticated
  USING (public.can_manage_page(auth.uid(), page_type, page_id));

CREATE POLICY "tables_insert_managers" ON public.event_tables
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'::public.organizer_role));

CREATE POLICY "tables_update_managers" ON public.event_tables
  FOR UPDATE TO authenticated
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'::public.organizer_role))
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'::public.organizer_role));

CREATE POLICY "tables_delete_managers" ON public.event_tables
  FOR DELETE TO authenticated
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'::public.organizer_role));

CREATE INDEX IF NOT EXISTS idx_event_tables_page ON public.event_tables(page_type, page_id);

CREATE OR REPLACE FUNCTION public.touch_event_tables_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_event_tables_updated_at ON public.event_tables;
CREATE TRIGGER trg_event_tables_updated_at
  BEFORE UPDATE ON public.event_tables
  FOR EACH ROW EXECUTE FUNCTION public.touch_event_tables_updated_at();

ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.event_tables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seat_number int;

CREATE INDEX IF NOT EXISTS idx_event_guests_table ON public.event_guests(table_id);
