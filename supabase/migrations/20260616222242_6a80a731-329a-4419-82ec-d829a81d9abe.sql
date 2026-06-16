
DROP INDEX IF EXISTS public.idx_event_urgent_messages_active_unique;

DO $$ BEGIN
  CREATE TYPE public.urgent_message_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.event_urgent_messages
  ADD COLUMN IF NOT EXISTS priority public.urgent_message_priority NOT NULL DEFAULT 'high',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_event_urgent_messages_active_order
  ON public.event_urgent_messages(page_type, page_id, display_order)
  WHERE is_active = true;
