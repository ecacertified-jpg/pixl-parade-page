-- Backfill social_share_photo_id for birthday pages that have at least one
-- usable album photo (media_type = 'image' with an image_url) but haven't
-- explicitly selected one yet. Improves the default OG image and stabilizes
-- the share-version tag used as a WhatsApp/Facebook cache-buster.
UPDATE public.birthday_pages bp
SET social_share_photo_id = sub.photo_id,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (birthday_page_id)
    birthday_page_id,
    id AS photo_id
  FROM public.birthday_page_photos
  WHERE media_type = 'image'
    AND image_url IS NOT NULL
    AND image_url <> ''
  ORDER BY birthday_page_id, created_at ASC
) sub
WHERE bp.id = sub.birthday_page_id
  AND bp.social_share_photo_id IS NULL;