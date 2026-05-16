
-- 1) birthday_wishes_messages — empêcher l'usurpation
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.birthday_wishes_messages;
CREATE POLICY "Senders can insert their own messages"
ON public.birthday_wishes_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 2) page_gift_promises — retirer le SELECT public + RPC d'agrégation
DROP POLICY IF EXISTS "Authenticated users can count promises" ON public.page_gift_promises;

CREATE OR REPLACE FUNCTION public.get_page_gift_promise_counts()
RETURNS TABLE (page_id uuid, page_type text, promise_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT page_id, page_type, COUNT(*)::bigint AS promise_count
  FROM public.page_gift_promises
  GROUP BY page_id, page_type;
$$;
REVOKE EXECUTE ON FUNCTION public.get_page_gift_promise_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_page_gift_promise_counts() TO authenticated, anon;

-- 3) Storage business-gallery — vérifier la propriété
DROP POLICY IF EXISTS "Authenticated users can upload to business gallery" ON storage.objects;
CREATE POLICY "Business owners can upload to their gallery"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-gallery'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id::text = (storage.foldername(objects.name))[1]
      AND ba.user_id = auth.uid()
  )
);

-- 4) fund_contributions — masquer les PII guest aux autres participants
DROP POLICY IF EXISTS fund_contributions_select_participants ON public.fund_contributions;
CREATE POLICY fund_contributions_select_participants
ON public.fund_contributions
FOR SELECT
TO authenticated
USING (
  is_anonymous = false
  AND user_has_contributed_to_fund(auth.uid(), fund_id)
  AND guest_phone IS NULL
  AND guest_email IS NULL
);

-- 5) Retirer les tables sensibles de Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='business_orders') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.business_orders';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='fund_contributions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.fund_contributions';
  END IF;
END$$;
