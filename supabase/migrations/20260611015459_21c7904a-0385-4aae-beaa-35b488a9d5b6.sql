
-- 1) Add new notification preference columns (defaults true)
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS push_new_visitor boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_new_reaction boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_new_memory boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_wedding_reminder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_family_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_weekly_memory_digest boolean NOT NULL DEFAULT true;

-- 2) Helper: fire-and-forget POST to an internal edge function
CREATE OR REPLACE FUNCTION public._jdv_notify_edge(fn_name text, payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504';
BEGIN
  PERFORM net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := payload
  );
EXCEPTION WHEN OTHERS THEN
  -- never break the originating transaction
  RAISE WARNING 'jdv_notify_edge failed: % - %', fn_name, SQLERRM;
END;
$$;

-- 3) Trigger: photo view -> notify-page-visitor
CREATE OR REPLACE FUNCTION public._jdv_trg_page_visit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.viewer_id IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM public._jdv_notify_edge('notify-page-visitor', jsonb_build_object(
    'photo_id', NEW.photo_id,
    'viewer_id', NEW.viewer_id
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jdv_push_on_page_visit ON public.birthday_page_photo_views;
CREATE TRIGGER trg_jdv_push_on_page_visit
AFTER INSERT ON public.birthday_page_photo_views
FOR EACH ROW EXECUTE FUNCTION public._jdv_trg_page_visit();

-- 4) Trigger: post reaction
CREATE OR REPLACE FUNCTION public._jdv_trg_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._jdv_notify_edge('notify-new-reaction', jsonb_build_object(
    'kind', 'post',
    'target_id', NEW.post_id,
    'actor_id', NEW.user_id,
    'reaction_type', NEW.reaction_type
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jdv_push_on_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_jdv_push_on_post_reaction
AFTER INSERT ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public._jdv_trg_post_reaction();

-- 5) Trigger: album photo reaction
CREATE OR REPLACE FUNCTION public._jdv_trg_album_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._jdv_notify_edge('notify-new-reaction', jsonb_build_object(
    'kind', 'album_photo',
    'target_id', NEW.photo_id,
    'actor_id', NEW.user_id,
    'reaction_type', NEW.reaction_type
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jdv_push_on_album_reaction ON public.album_photo_reactions;
CREATE TRIGGER trg_jdv_push_on_album_reaction
AFTER INSERT ON public.album_photo_reactions
FOR EACH ROW EXECUTE FUNCTION public._jdv_trg_album_reaction();

-- 6) Trigger: new memory (album photo upload)
CREATE OR REPLACE FUNCTION public._jdv_trg_new_memory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._jdv_notify_edge('notify-new-memory', jsonb_build_object(
    'photo_id', NEW.id,
    'birthday_page_id', NEW.birthday_page_id,
    'uploader_id', NEW.uploader_id
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jdv_push_on_new_memory ON public.birthday_page_photos;
CREATE TRIGGER trg_jdv_push_on_new_memory
AFTER INSERT ON public.birthday_page_photos
FOR EACH ROW EXECUTE FUNCTION public._jdv_trg_new_memory();
