
CREATE TABLE public.memory_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  media_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  unlock_date date NOT NULL,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_unlocked boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_capsules_user ON public.memory_capsules(user_id);
CREATE INDEX idx_memory_capsules_unlock ON public.memory_capsules(unlock_date) WHERE is_unlocked = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_capsules TO authenticated;
GRANT ALL ON public.memory_capsules TO service_role;

ALTER TABLE public.memory_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own capsules"
ON public.memory_capsules FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recipients read unlocked capsules"
ON public.memory_capsules FOR SELECT
TO authenticated
USING (
  is_unlocked = true
  AND recipients ? auth.uid()::text
);

CREATE OR REPLACE FUNCTION public.touch_memory_capsules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER memory_capsules_touch
BEFORE UPDATE ON public.memory_capsules
FOR EACH ROW EXECUTE FUNCTION public.touch_memory_capsules();
