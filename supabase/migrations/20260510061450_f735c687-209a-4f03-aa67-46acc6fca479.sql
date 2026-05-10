
-- =========================================================
-- 1. collective_fund_orders : restreindre la lecture
-- =========================================================
DROP POLICY IF EXISTS "Users can view orders for funds they can access" ON public.collective_fund_orders;

CREATE POLICY "Owners, customer and admins can view fund orders"
ON public.collective_fund_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = collective_fund_orders.fund_id
      AND cf.creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.collective_funds cf
    JOIN public.products p ON cf.business_product_id = p.id
    JOIN public.business_accounts ba ON p.business_account_id = ba.id
    WHERE cf.id = collective_fund_orders.fund_id
      AND ba.user_id = auth.uid()
  )
  OR public.is_active_admin(auth.uid())
);

-- =========================================================
-- 2. business_performance_alerts : INSERT public -> service_role
-- =========================================================
DROP POLICY IF EXISTS "System can insert business alerts" ON public.business_performance_alerts;
-- "Service role inserts performance alerts" already exists for service_role

-- =========================================================
-- 3. admin_report_logs : INSERT public -> service_role
-- =========================================================
DROP POLICY IF EXISTS "Service role can insert logs" ON public.admin_report_logs;
-- "Service role inserts report logs" already exists for service_role

-- =========================================================
-- 4. community_scores : INSERT/UPDATE public -> service_role only
-- =========================================================
DROP POLICY IF EXISTS "System can insert community scores" ON public.community_scores;
DROP POLICY IF EXISTS "Users can update their own community score" ON public.community_scores;

CREATE POLICY "Service role can insert community scores"
ON public.community_scores
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update community scores"
ON public.community_scores
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================================
-- 5. birthday_celebrations : INSERT public -> service_role
-- =========================================================
DROP POLICY IF EXISTS "System can insert birthday celebrations" ON public.birthday_celebrations;

CREATE POLICY "Service role can insert birthday celebrations"
ON public.birthday_celebrations
FOR INSERT
TO service_role
WITH CHECK (true);

-- =========================================================
-- 6. user_badges : INSERT/UPDATE public -> service_role only
-- =========================================================
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update their own badges" ON public.user_badges;

CREATE POLICY "Service role can insert user badges"
ON public.user_badges
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update user badges"
ON public.user_badges
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================================
-- 7. loyalty_points : retirer le UPDATE utilisateur
-- =========================================================
DROP POLICY IF EXISTS "Users can update their own loyalty points" ON public.loyalty_points;

CREATE POLICY "Service role can update loyalty points"
ON public.loyalty_points
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can insert loyalty points"
ON public.loyalty_points
FOR INSERT
TO service_role
WITH CHECK (true);

-- =========================================================
-- 8. admin_growth_alerts : INSERT public -> service_role
-- =========================================================
DROP POLICY IF EXISTS "System can insert alerts" ON public.admin_growth_alerts;

-- =========================================================
-- 9. indexnow_submissions : INSERT public -> service_role
-- =========================================================
DROP POLICY IF EXISTS "Service role can insert indexnow submissions" ON public.indexnow_submissions;

CREATE POLICY "Service role inserts indexnow submissions"
ON public.indexnow_submissions
FOR INSERT
TO service_role
WITH CHECK (true);

-- =========================================================
-- 10. reciprocity_scores : SELECT public -> authenticated
-- =========================================================
DROP POLICY IF EXISTS "Users can view all scores" ON public.reciprocity_scores;

CREATE POLICY "Authenticated users can view reciprocity scores"
ON public.reciprocity_scores
FOR SELECT
TO authenticated
USING (true);

-- =========================================================
-- 11. admin_share_codes : retirer la SELECT publique sur la table,
--     créer une vue publique limitée (code + is_active)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read active share codes by code" ON public.admin_share_codes;

CREATE OR REPLACE VIEW public.admin_share_codes_public
WITH (security_invoker = true)
AS
SELECT code, is_active
FROM public.admin_share_codes
WHERE is_active = true;

-- Ré-autoriser la lecture publique uniquement de cette vue minimaliste
CREATE POLICY "Public can validate active share codes"
ON public.admin_share_codes
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND current_setting('request.path', true) LIKE '%admin_share_codes_public%'
);

-- Note: la vue elle-même est sécurisée par security_invoker; l'accès granulaire
-- réel aux colonnes sensibles reste limité aux policies admin existantes.

-- =========================================================
-- 12. ai_conversations / ai_messages : retirer les branches user_id IS NULL
-- =========================================================
DROP POLICY IF EXISTS "Anonymous sessions can read conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anonymous sessions can insert messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can update message feedback" ON public.ai_messages;

-- Recréer SELECT/UPDATE sans la branche anonyme
CREATE POLICY "Users can view messages of their conversations"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update message feedback"
ON public.ai_messages
FOR UPDATE
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
  )
);

-- L'accès anonyme aux conversations/messages doit désormais passer
-- par une edge function utilisant le service_role.

-- =========================================================
-- 13. STORAGE: product-videos -> ownership check sur business_accounts
-- =========================================================
DROP POLICY IF EXISTS "Business owners can upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update product videos" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can delete product videos" ON storage.objects;

CREATE POLICY "Business owners can upload own product videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id::text = (storage.foldername(name))[1]
      AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update own product videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id::text = (storage.foldername(name))[1]
      AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete own product videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id::text = (storage.foldername(name))[1]
      AND ba.user_id = auth.uid()
  )
);

-- =========================================================
-- 14. STORAGE: birthday-page-photos -> ownership check
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can upload birthday page photos" ON storage.objects;

CREATE POLICY "Owners can upload birthday page photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'birthday-page-photos'
  AND EXISTS (
    SELECT 1 FROM public.birthday_pages bp
    WHERE bp.id::text = (storage.foldername(name))[1]
      AND bp.user_id = auth.uid()
  )
);

-- =========================================================
-- 15. STORAGE: event-page-photos -> ownership check
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;

CREATE POLICY "Owners can upload event page photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-page-photos'
  AND EXISTS (
    SELECT 1 FROM public.event_pages ep
    WHERE ep.id::text = (storage.foldername(name))[1]
      AND ep.creator_id = auth.uid()
  )
);

-- =========================================================
-- 16. STORAGE: og-images-cache -> service_role only writes
-- =========================================================
DROP POLICY IF EXISTS "Service role can upload OG images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update OG images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete OG images" ON storage.objects;

CREATE POLICY "Service role uploads OG images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'og-images-cache');

CREATE POLICY "Service role updates OG images"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'og-images-cache')
WITH CHECK (bucket_id = 'og-images-cache');

CREATE POLICY "Service role deletes OG images"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'og-images-cache');

-- =========================================================
-- 17. REALTIME: retirer admin_notifications de la publication
-- (empêche la diffusion broadcast de notifications admin à tous les abonnés)
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications';
  END IF;
END $$;
