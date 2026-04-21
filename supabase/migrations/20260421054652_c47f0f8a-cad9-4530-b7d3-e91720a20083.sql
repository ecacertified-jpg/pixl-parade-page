-- 1. Ajouter la colonne published_at
ALTER TABLE public.birthday_pages ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 2. Backfill : pages déjà actives = déjà publiées
UPDATE public.birthday_pages
SET published_at = created_at
WHERE is_active = true AND published_at IS NULL;

-- 3. Index partiel pour le filtre du fil
CREATE INDEX IF NOT EXISTS idx_birthday_pages_published
ON public.birthday_pages (published_at)
WHERE published_at IS NOT NULL;

-- 4. Backfill rétroactif : rattacher les cagnottes d'anniversaire existantes aux pages
UPDATE public.birthday_pages bp
SET fund_id = cf.id
FROM public.collective_funds cf
WHERE bp.fund_id IS NULL
  AND cf.creator_id = bp.user_id
  AND cf.occasion = 'birthday'
  AND cf.status = 'active'
  AND (cf.deadline_date IS NULL OR cf.deadline_date >= now());