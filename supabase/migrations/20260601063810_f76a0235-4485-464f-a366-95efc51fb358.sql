-- Add spouse fields to event_pages (used for marriage pages with 2 avatars)
ALTER TABLE public.event_pages
  ADD COLUMN IF NOT EXISTS spouse_first_name text,
  ADD COLUMN IF NOT EXISTS spouse_avatar_url text,
  ADD COLUMN IF NOT EXISTS spouse_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure GRANTs on event_pages (defensive — table existed before grant policy)
GRANT SELECT ON public.event_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_pages TO authenticated;
GRANT ALL ON public.event_pages TO service_role;
