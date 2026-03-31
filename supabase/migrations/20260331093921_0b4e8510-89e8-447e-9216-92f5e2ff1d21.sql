
-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Birthday user can read their messages" 
  ON public.birthday_wishes_messages;

-- Allow authenticated users to read messages on active birthday pages
CREATE POLICY "Anyone can read birthday messages on active pages"
  ON public.birthday_wishes_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id
      AND bp.is_active = true
    )
  );

-- Allow anonymous users to read messages on active birthday pages
CREATE POLICY "Anon can read birthday messages on active pages"
  ON public.birthday_wishes_messages
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id
      AND bp.is_active = true
    )
  );
