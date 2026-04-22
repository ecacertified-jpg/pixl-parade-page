-- 1) Add column to distinguish explicit publication from backfill
ALTER TABLE public.birthday_pages 
  ADD COLUMN IF NOT EXISTS published_via_onboarding boolean NOT NULL DEFAULT false;

-- 2) Unpublish pages that were backfilled but are clearly auto-created (no content)
UPDATE public.birthday_pages bp
SET published_at = NULL
WHERE published_at IS NOT NULL
  AND published_via_onboarding = false
  AND fund_id IS NULL
  AND cover_image_url IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.birthday_page_photos bpp 
    WHERE bpp.birthday_page_id = bp.id
  );

-- 3) For each user/year with multiple published pages remaining, keep only the best one
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, celebration_year 
           ORDER BY (fund_id IS NOT NULL) DESC, 
                    (cover_image_url IS NOT NULL) DESC,
                    created_at ASC
         ) AS rn
  FROM public.birthday_pages
  WHERE published_at IS NOT NULL AND is_active = true
)
UPDATE public.birthday_pages SET published_at = NULL
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 4) Deactivate completely empty duplicate draft pages (keep 1 per user/year)
WITH dupes AS (
  SELECT bp.id, ROW_NUMBER() OVER (
    PARTITION BY bp.user_id, bp.celebration_year 
    ORDER BY bp.created_at ASC
  ) rn
  FROM public.birthday_pages bp
  WHERE bp.is_active = true 
    AND bp.fund_id IS NULL 
    AND bp.cover_image_url IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.birthday_page_photos bpp 
      WHERE bpp.birthday_page_id = bp.id
    )
)
UPDATE public.birthday_pages SET is_active = false 
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 5) Unique index to prevent future duplicates among active pages
CREATE UNIQUE INDEX IF NOT EXISTS idx_birthday_pages_user_year_active 
  ON public.birthday_pages (user_id, celebration_year) 
  WHERE is_active = true;