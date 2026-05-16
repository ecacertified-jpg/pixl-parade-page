
ALTER TABLE public.birthday_pages
  ADD COLUMN IF NOT EXISTS social_share_photo_id uuid NULL
    REFERENCES public.birthday_page_photos(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.bump_birthday_page_updated_at_on_social_share()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.social_share_photo_id IS DISTINCT FROM OLD.social_share_photo_id THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_birthday_page_social_share ON public.birthday_pages;
CREATE TRIGGER trg_bump_birthday_page_social_share
  BEFORE UPDATE ON public.birthday_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_birthday_page_updated_at_on_social_share();
