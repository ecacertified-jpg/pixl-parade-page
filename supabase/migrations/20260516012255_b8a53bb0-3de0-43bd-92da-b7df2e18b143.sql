
ALTER TABLE public.birthday_pages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_birthday_pages_updated_at ON public.birthday_pages;
CREATE TRIGGER update_birthday_pages_updated_at
BEFORE UPDATE ON public.birthday_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.birthday_pages SET updated_at = COALESCE(published_at, created_at) WHERE updated_at IS NULL;
