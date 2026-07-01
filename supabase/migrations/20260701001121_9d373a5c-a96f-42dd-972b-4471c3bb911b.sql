GRANT SELECT ON public.user_favorites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_favorites'
      AND policyname = 'Anyone can view favorites of users with active event page'
  ) THEN
    CREATE POLICY "Anyone can view favorites of users with active event page"
    ON public.user_favorites
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.event_pages ep
        WHERE ep.creator_id = user_favorites.user_id
          AND ep.is_active = true
      )
    );
  END IF;
END $$;