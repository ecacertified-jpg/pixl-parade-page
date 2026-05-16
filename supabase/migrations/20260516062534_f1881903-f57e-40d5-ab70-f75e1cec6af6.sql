
CREATE OR REPLACE FUNCTION public.trigger_invalidate_birthday_og()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
BEGIN
  v_slug := COALESCE(NEW.slug, OLD.slug);
  IF v_slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only fire when something share-visible actually changed
  IF TG_OP = 'UPDATE' AND
     NEW.cover_image_url IS NOT DISTINCT FROM OLD.cover_image_url AND
     NEW.is_active IS NOT DISTINCT FROM OLD.is_active AND
     NEW.published_at IS NOT DISTINCT FROM OLD.published_at AND
     NEW.title IS NOT DISTINCT FROM OLD.title THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/invalidate-birthday-og',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('slug', v_slug)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the user write because of an invalidation hiccup.
  RAISE WARNING 'invalidate-birthday-og trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_birthday_pages_invalidate_og ON public.birthday_pages;
CREATE TRIGGER trg_birthday_pages_invalidate_og
AFTER UPDATE OR INSERT ON public.birthday_pages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_invalidate_birthday_og();
