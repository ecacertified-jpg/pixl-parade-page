

# Plan : Corriger les 10 findings de sécurité restants

## Diagnostic

La migration de sécurité précédente a échoué partiellement. Les policies permissives originales n'ont **jamais été supprimées** de la base de données. Résultat : les nouvelles policies correctes coexistent avec les anciennes dangereuses, et PostgreSQL applique la plus permissive (en mode `PERMISSIVE`).

## Findings actifs (10)

| # | Scanner | Problème | Sévérité |
|---|---------|----------|----------|
| 1 | supabase_lov | `notification_analytics` — policy `ALL` sur `public` avec `USING(true)` | error |
| 2 | supabase_lov | `business_waitlist` — SELECT `USING(true)` expose noms/emails/phones | error |
| 3 | supabase_lov | `business_accounts` — SELECT expose email/phone des business | error |
| 4 | supabase_lov | `profile_completion_reminders` — INSERT/UPDATE `true` sur `public` | warn |
| 5 | supabase_lov | Realtime — pas de filtrage sur les channels | warn |
| 6 | supabase | `rls_policy_always_true` — ~20 policies `USING(true)` restantes | warn |
| 7 | supabase | `function_search_path_mutable` — fonctions sans `SET search_path` | warn |
| 8 | supabase | `rls_enabled_no_policy` — tables avec RLS activé mais sans policy | info |
| 9 | supabase | `public_bucket_allows_listing` — buckets storage listables | warn |
| 10 | agent_security | `send-whatsapp-otp` — pas de rate limiting IP | error |

Plus 2 warnings agent_security (string interpolation, temp_password) qui nécessitent des changements de code/Edge Functions.

## Étape 1 — Migration SQL (résoudre 6 findings DB)

Une seule migration qui **DROP les anciennes policies avant de recréer** :

### 1.1 `notification_analytics`
```sql
DROP POLICY "Service role can manage notification analytics" ON notification_analytics;
```

### 1.2 `business_waitlist`
```sql
DROP POLICY "Users can view own waitlist entry" ON business_waitlist;
CREATE POLICY "Users can view own waitlist entry" ON business_waitlist
  FOR SELECT USING (auth.uid() IS NOT NULL AND email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));
```

### 1.3 `business_accounts` — restreindre le SELECT public
```sql
DROP POLICY "Public can view active businesses" ON business_accounts;
-- Le code client utilise déjà business_public_info (vue sécurisée)
```

### 1.4 `profile_completion_reminders`
```sql
DROP POLICY "System can insert reminders" ON profile_completion_reminders;
DROP POLICY "System can update reminders" ON profile_completion_reminders;
CREATE POLICY "Service role manages reminders" ON profile_completion_reminders
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 1.5 Storage — ownership check sur business-gallery
```sql
DROP POLICY "Authenticated users can delete from business gallery" ON storage.objects;
DROP POLICY "Authenticated users can update business gallery" ON storage.objects;
-- Recréer avec vérification propriétaire via business_accounts.id dans le path
```

### 1.6 Fonctions `search_path` mutable
Ajouter `SET search_path = public` aux fonctions security definer existantes.

## Étape 2 — Rate limiting OTP (Edge Function)

Ajouter un rate limiting IP dans `send-whatsapp-otp/index.ts` via la table `rate_limit_buckets` existante (max 5 requêtes / 10 min par IP).

## Étape 3 — Refactorer `BusinessInitiatedFundsSection.tsx`

Remplacer l'interpolation `.or()` restante par deux queries `Promise.all` (la correction précédente n'a peut-être pas pris effet).

## Étape 4 — Marquer les findings résolus

Utiliser `security--manage_security_finding` pour marquer chaque finding fixé, ce qui décrémentera le compteur.

## Étape 5 — Realtime (info seulement)

Le finding Realtime nécessite une configuration côté Supabase Dashboard (broadcast/presence authorization), pas de migration possible. On le documentera comme "acknowledged".

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/new.sql` | DROP + recréer ~8 policies |
| `supabase/functions/send-whatsapp-otp/index.ts` | Rate limiting IP |
| `src/components/BusinessInitiatedFundsSection.tsx` | Vérifier refactoring `.or()` |

