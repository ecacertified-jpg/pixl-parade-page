
-- 1) Extend birthday_wishes_messages
ALTER TABLE public.birthday_wishes_messages
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_metadata JSONB,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS card_template_id UUID,
  ADD COLUMN IF NOT EXISTS visitor_first_name TEXT,
  ADD COLUMN IF NOT EXISTS visitor_phone_hash TEXT,
  ADD COLUMN IF NOT EXISTS visitor_phone_country TEXT,
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'safe',
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactions_count INTEGER NOT NULL DEFAULT 0;

-- Allow message_text to be empty (when sending only media)
ALTER TABLE public.birthday_wishes_messages
  ALTER COLUMN message_text DROP NOT NULL;

ALTER TABLE public.birthday_wishes_messages
  ADD CONSTRAINT bwm_media_type_chk
  CHECK (media_type IN ('text','gif','sticker','card','emoji','image','youtube','audio','animated_text'));

ALTER TABLE public.birthday_wishes_messages
  ADD CONSTRAINT bwm_moderation_chk
  CHECK (moderation_status IN ('safe','pending_review','unsafe'));

CREATE INDEX IF NOT EXISTS idx_bwm_page_created
  ON public.birthday_wishes_messages (birthday_page_id, created_at DESC);

-- 2) Allow public read of safe, non-hidden messages
DROP POLICY IF EXISTS "Public can read safe messages" ON public.birthday_wishes_messages;
CREATE POLICY "Public can read safe messages"
ON public.birthday_wishes_messages
FOR SELECT
TO anon, authenticated
USING (
  is_hidden = false
  AND moderation_status <> 'unsafe'
);

-- 3) Birthday page owner can hide/update their messages
DROP POLICY IF EXISTS "Page owner can manage messages" ON public.birthday_wishes_messages;
CREATE POLICY "Page owner can manage messages"
ON public.birthday_wishes_messages
FOR UPDATE
TO authenticated
USING (birthday_user_id = auth.uid())
WITH CHECK (birthday_user_id = auth.uid());

DROP POLICY IF EXISTS "Page owner can delete messages" ON public.birthday_wishes_messages;
CREATE POLICY "Page owner can delete messages"
ON public.birthday_wishes_messages
FOR DELETE
TO authenticated
USING (birthday_user_id = auth.uid());

-- 4) Admin manage all
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.birthday_wishes_messages;
CREATE POLICY "Admins can manage all messages"
ON public.birthday_wishes_messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5) Birthday card templates (admin-managed library)
CREATE TABLE IF NOT EXISTS public.birthday_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('anniversaire','merci','adieu','felicitations')),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bct_active_cat
  ON public.birthday_card_templates (is_active, category, display_order);

ALTER TABLE public.birthday_card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active card templates"
ON public.birthday_card_templates
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage card templates"
ON public.birthday_card_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE TRIGGER trg_bct_updated_at
BEFORE UPDATE ON public.birthday_card_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Storage bucket for message media
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-message-media', 'birthday-message-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read birthday message media" ON storage.objects;
CREATE POLICY "Public read birthday message media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'birthday-message-media');

DROP POLICY IF EXISTS "Admins manage birthday message media" ON storage.objects;
CREATE POLICY "Admins manage birthday message media"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'birthday-message-media' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  bucket_id = 'birthday-message-media' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
