CREATE POLICY "Anyone can view favorites of users with active birthday page"
ON public.user_favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.birthday_pages
    WHERE birthday_pages.user_id = user_favorites.user_id
      AND birthday_pages.is_active = true
      AND birthday_pages.published_at IS NOT NULL
  )
);