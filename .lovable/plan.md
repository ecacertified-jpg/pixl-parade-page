

# Plan : Corriger les 8 findings de sécurité restants

## Findings actifs

| # | Scanner | Problème | Sévérité |
|---|---------|----------|----------|
| 1 | supabase_lov | `og_image_cache_metadata` — policy ALL sur rôle `public` au lieu de `service_role` | error |
| 2 | supabase_lov | `profiles` — PII (phone, birthday, GPS) accessible aux **non-authentifiés** via `privacy_setting='public'` | error |
| 3 | supabase_lov | Realtime — données admin/commandes diffusées sans restriction | error |
| 4 | supabase_lov | `platform_settings` — SELECT `USING(true)` pour tous les authentifiés | warn |
| 5 | supabase | `rls_policy_always_true` — ~15 policies INSERT/UPDATE avec `true` | warn |
| 6 | supabase | `function_search_path_mutable` — 9 fonctions security definer sans `SET search_path` | warn |
| 7 | supabase | `rls_enabled_no_policy` — `whatsapp_otp_codes` et `shortened_urls` sans policies | info |
| 8 | supabase | `public_bucket_allows_listing` — buckets publics listables | warn |

---

## Étape 1 — Migration SQL (findings 1, 2, 4, 5, 6, 7)

### 1.1 `og_image_cache_metadata` — Corriger le rôle de la policy ALL
```sql
DROP POLICY "Service role can manage cache metadata" ON og_image_cache_metadata;
CREATE POLICY "Service role manages cache metadata"
ON og_image_cache_metadata FOR ALL TO service_role
USING (true) WITH CHECK (true);
-- Garder la policy SELECT publique (lecture cache OG = légitime)
```

### 1.2 `profiles` — Restreindre la policy publique aux authentifiés
La policy "Users can view profiles based on privacy" s'applique au rôle `{public}` (inclut les anonymes). Modifier pour l'appliquer uniquement à `{authenticated}` :
```sql
DROP POLICY "Users can view profiles based on privacy" ON profiles;
CREATE POLICY "Users can view profiles based on privacy"
ON profiles FOR SELECT TO authenticated
USING (
  (is_deleted IS NULL OR is_deleted = false)
  AND (
    auth.uid() = user_id
    OR privacy_setting = 'public'
    OR (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid() AND following_id = profiles.user_id
    ))
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);
```

### 1.3 `platform_settings` — Restreindre aux admins
```sql
DROP POLICY "Authenticated users can view platform settings" ON platform_settings;
-- Les super admins ont déjà leur propre policy SELECT
```
Vérifier dans le code les appels `.from('platform_settings')` pour s'assurer qu'ils sont faits par des admins ou via une RPC.

### 1.4 Policies `WITH CHECK (true)` sur INSERT
Les INSERT policies avec `WITH CHECK(true)` sur des tables système (analytics, tracking, alerts) sont intentionnelles — elles permettent aux triggers/functions d'insérer. Cependant, elles sont sur le rôle `public` au lieu de `service_role`. Les principales à corriger :
- `admin_growth_alerts`, `admin_report_logs`, `business_performance_alerts`, `country_objective_alerts`, `reciprocity_imbalance_alerts` — restreindre INSERT à `service_role`
- `product_views`, `product_shares`, `product_share_events`, `business_share_events` — garder `public` (tracking légitime côté client)

### 1.5 Fonctions `search_path` mutable (9 fonctions)
```sql
ALTER FUNCTION is_active_admin SET search_path = public;
ALTER FUNCTION notify_admin_new_business SET search_path = public;
ALTER FUNCTION notify_admin_new_client SET search_path = public;
ALTER FUNCTION notify_admin_new_order SET search_path = public;
ALTER FUNCTION notify_admin_refund_request SET search_path = public;
ALTER FUNCTION notify_business_on_new_order SET search_path = public;
ALTER FUNCTION trigger_update_metrics_on_favorite SET search_path = public;
ALTER FUNCTION trigger_update_metrics_on_view SET search_path = public;
ALTER FUNCTION update_product_metrics SET search_path = public;
```

### 1.6 Tables RLS sans policies
```sql
-- whatsapp_otp_codes : accès service_role uniquement (données OTP sensibles)
CREATE POLICY "Service role manages OTP codes"
ON whatsapp_otp_codes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- shortened_urls : lecture publique, écriture service_role
CREATE POLICY "Anyone can read shortened URLs"
ON shortened_urls FOR SELECT TO public USING (true);
CREATE POLICY "Service role manages shortened URLs"
ON shortened_urls FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## Étape 2 — Vérifier `platform_settings` dans le code

Chercher les usages de `.from('platform_settings')` dans le code client pour s'assurer qu'ils fonctionneront après la suppression de la policy SELECT publique. Si le `price_markup_rate` est lu côté client, créer une RPC security definer pour ne retourner que les settings non-sensibles.

---

## Étape 3 — Marquer les findings résolus

Utiliser `security--manage_security_finding` pour :
- **mark_as_fixed** : findings 1, 2, 4, 6, 7
- **ignore** : finding 3 (Realtime — nécessite config Dashboard Supabase, pas de migration possible), finding 5 (policies `true` restantes sont sur `service_role` ou tracking légitime), finding 8 (buckets publics pour avatars/produits — listing intentionnel)

---

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/new.sql` | DROP + recréer ~6 policies, ALTER 9 fonctions, ajouter policies sur 2 tables |
| Code client (si nécessaire) | Vérifier accès `platform_settings` après restriction |

