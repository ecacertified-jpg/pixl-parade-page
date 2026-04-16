CREATE POLICY "Authenticated users can count promises" ON public.page_gift_promises
  FOR SELECT
  TO authenticated
  USING (true);