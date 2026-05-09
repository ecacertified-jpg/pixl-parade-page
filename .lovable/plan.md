## Objectif
Corriger les vulnérabilités détectées par les scanners de sécurité **uniquement via des migrations SQL Supabase** (RLS, policies, storage, fonctions). Aucun fichier applicatif (`src/`, edge functions) ne sera modifié — seules les politiques de la base de données seront durcies.

## Findings à corriger (par priorité)

### 🔴 ERROR — corrections obligatoires

1. **`collective_fund_orders` — fuite de téléphones** : la policy SELECT laisse n'importe qui lire `donor_phone` / `beneficiary_phone` dès que la cagnotte est publique. → Restreindre à : créateur du fonds, client de la commande, ou admin.

2. **`business_performance_alerts` — INSERT ouvert à `public`** → Restreindre à `service_role`.

3. **`admin_report_logs` — INSERT ouvert à `public`** → Restreindre à `service_role`.

4. **`community_scores` — INSERT ouvert + UPDATE manipulable** → INSERT = `service_role`. Supprimer la policy UPDATE utilisateur (les mises à jour passeront par fonctions SECURITY DEFINER existantes).

5. **`birthday_celebrations` — INSERT ouvert à `public`** → `service_role` uniquement.

6. **Storage `product-videos`** — INSERT/UPDATE/DELETE sans vérif d'ownership → Ajouter une vérification que `(storage.foldername(name))[1]` correspond à un `business_accounts.id` dont `user_id = auth.uid()`.

7. **Storage `birthday-page-photos` & `event-page-photos`** — INSERT sans vérif d'ownership → Vérifier que le 1er segment du chemin est un `birthday_pages.id` (resp. `event_pages.id`) appartenant à `auth.uid()`.

8. **Realtime `admin_notifications`** — diffusion à tous les abonnés → Ajouter une policy RLS sur `realtime.messages` restreignant les topics `admin_notifications*` aux utilisateurs présents dans `admin_users` (actifs).

9. **`user_badges` — INSERT ouvert à `public`** → `service_role` uniquement.

10. **`loyalty_points` — UPDATE auto-modifiable** → Supprimer la policy UPDATE utilisateur (mutations via fonctions SECURITY DEFINER).

11. **Storage `og-images-cache`** — INSERT/UPDATE/DELETE ouverts à `public` → `service_role`.

12. **`admin_growth_alerts` — INSERT ouvert à `public`** → `service_role`.

### 🟡 WARN

13. **`admin_share_codes`** — la policy publique expose `admin_user_id` et stats. → Créer une **vue publique** `admin_share_codes_public` exposant uniquement `code` + `is_active`, et restreindre la table à admins / `service_role`.

14. **`reciprocity_scores`** — exposition publique des scores financiers. → Restreindre la SELECT à `authenticated`.

15. **`ai_messages` / `ai_conversations`** — toutes les sessions anonymes lisibles par tous. → Retirer la branche `user_id IS NULL` ; limiter `anon` à la session courante via `session_id` (header `x-session-id` non disponible côté Postgres → restreindre la lecture anon aux conversations du jour, ou plus simplement : interdire la lecture anon et forcer la lecture via edge function avec service_role).

16. **`indexnow_submissions` — INSERT ouvert à `public`** → `service_role`.

### 🟡 Linter Supabase (général)
- **`function_search_path_mutable`** : ajouter `SET search_path = public` aux fonctions concernées (sera fait au cas par cas dans la migration en interrogeant `pg_proc`).
- **`security_definer_function_executable` (anon/auth)** : `REVOKE EXECUTE ... FROM anon, authenticated` sur les fonctions SECURITY DEFINER non destinées à un appel direct (ex. fonctions internes utilisées dans triggers ou RLS — `has_role` doit rester accessible).
- **`rls_enabled_no_policy`** : identifier les tables concernées et soit ajouter une policy de refus (`USING (false)`), soit désactiver RLS si table vide intentionnellement.

## Stratégie d'exécution

**Une seule migration consolidée** : `supabase/migrations/<timestamp>_security_hardening.sql`, structurée par section :

```sql
-- 1. Fund orders: restrict SELECT
DROP POLICY IF EXISTS "Users can view orders for funds they can access" ON public.collective_fund_orders;
CREATE POLICY "Owner/customer/admin can view fund orders"
ON public.collective_fund_orders FOR SELECT TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.collective_funds f
             WHERE f.id = fund_id AND f.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 2-5, 9, 11-12, 16. service_role-only INSERT pattern
DROP POLICY IF EXISTS "<old name>" ON public.<table>;
CREATE POLICY "Service role can insert <table>"
ON public.<table> FOR INSERT TO service_role WITH CHECK (true);

-- 6. product-videos ownership
DROP POLICY ... ON storage.objects;
CREATE POLICY "Business owners manage own product videos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-videos' AND EXISTS (
  SELECT 1 FROM public.business_accounts
  WHERE id::text = (storage.foldername(name))[1]
  AND user_id = auth.uid()
))
WITH CHECK (...same...);

-- 7. birthday/event page photos: path-based ownership check
-- 8. realtime.messages policy referencing admin_users
-- 10. drop loyalty_points self-update policy
-- 13. admin_share_codes_public view + tighten table
-- 14. reciprocity_scores: restrict to authenticated
-- 15. ai_messages / ai_conversations: drop NULL user_id branch
-- linter: SET search_path on flagged functions, REVOKE EXECUTE on internal definer fns
```

## Vérification

Après la migration :
1. `supabase--linter` pour confirmer la résolution des warnings DB.
2. `security--run_security_scan` pour relancer le scan Lovable.
3. Tester rapidement dans l'aperçu : créer une cagnotte, consulter une page d'anniversaire publique, vérifier que les flux utilisateur ne sont pas cassés (les écritures système passent toutes par des edge functions avec `service_role`, donc aucun impact attendu).
4. Marquer chaque finding résolu via `security--manage_security_finding`.

## Détails techniques importants

- **Aucun fichier `src/` ni edge function ne sera touché.** Les edge functions utilisent déjà le `service_role` côté serveur, donc le passage des policies à `service_role`-only ne casse rien.
- Les politiques RLS reposent sur la fonction `public.has_role(uuid, app_role)` déjà en place.
- Pour `realtime.messages`, la policy utilisera le pattern documenté Supabase (`realtime.topic()` + check sur `admin_users`).
- Si l'inspection révèle qu'une edge function utilise actuellement la clé anon pour insérer dans une de ces tables (peu probable), on créera plutôt une fonction SECURITY DEFINER restreinte plutôt que `service_role`-only — à vérifier par recherche `rg` lors de l'implémentation.
