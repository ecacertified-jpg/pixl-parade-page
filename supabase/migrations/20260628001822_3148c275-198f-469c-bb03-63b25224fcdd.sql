ALTER TABLE public.client_accounts ADD COLUMN IF NOT EXISTS birthday_page_slug text;

-- Backfill from existing birthday_pages
UPDATE public.client_accounts ca
SET birthday_page_slug = bp.slug
FROM public.birthday_pages bp
WHERE ca.birthday_page_id = bp.id
  AND ca.birthday_page_slug IS NULL;