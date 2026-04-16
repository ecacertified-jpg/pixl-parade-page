

# Plan : Audit et corrections de sécurité (sans altérer les fonctionnalités)

## Synthèse des problemes detectes

Le scan de sécurité révèle **6 vulnérabilités critiques (error)**, **~25 avertissements (warn)** et plusieurs points d'amélioration. Voici le plan de correction, organisé par priorité.

---

## PRIORITE 1 — Vulnérabilités critiques (ERROR)

### 1.1 Données sensibles des profils exposées publiquement
**Problème** : La policy SELECT sur `profiles` expose phone, birthday, latitude, longitude aux utilisateurs anonymes quand `privacy_setting = 'public'`.
**Correction** : Créer une vue `public_profiles_safe` excluant ces champs et modifier la policy pour ne retourner que les colonnes non-sensibles. Alternative : remplacer la policy par une fonction security definer qui filtre les colonnes.

### 1.2 `notification_analytics` — accès total public
**Problème** : La policy "Service role can manage notification analytics" est appliquée au rôle `public` au lieu de `service_role`, donnant un accès complet (CRUD) à tous.
**Correction** : DROP la policy existante et la recréer avec le rôle `service_role` ou une condition `auth.uid() = user_id`.

### 1.3 `business_waitlist` — données applicants exposées
**Problème** : Policy "Users can view own waitlist entry" avec `USING (true)` expose noms, emails, téléphones de tous les candidats.
**Correction** : Remplacer par `USING (auth.uid() = user_id)` ou un match sur l'email de l'utilisateur connecté.

### 1.4 `business_accounts` — email/téléphone exposés publiquement
**Problème** : Policy "Public can view active businesses" expose email et phone.
**Correction** : Vérifier que le code client utilise `business_public_info` (vue sécurisée existante). Supprimer ou restreindre la policy SELECT directe sur `business_accounts`.

### 1.5 `ai_messages` — messages anonymes lisibles par tous
**Problème** : La clause `OR (ai_conversations.user_id IS NULL)` permet à tout utilisateur authentifié de lire les messages anonymes.
**Correction** : Supprimer la clause `IS NULL` ou restreindre par `session_id`.

### 1.6 Storage — galerie business modifiable par tous
**Problème** : Les policies UPDATE/DELETE sur `business-gallery` et `product-videos` vérifient seulement `auth.role() = 'authenticated'` sans vérifier la propriété.
**Correction** : Ajouter un JOIN sur `business_accounts` pour vérifier que le fichier appartient au business de l'utilisateur (via le path prefix).

---

## PRIORITE 2 — Avertissements importants (WARN)

### 2.1 `send-whatsapp-otp` — endpoint OTP sans protection
**Problème** : `verify_jwt = false`, pas de rate limiting IP. Risque d'OTP bombing.
**Correction** : Ajouter un rate limiting par IP dans la Edge Function (max 5 OTPs/10min par IP).

### 2.2 Payment IDOR — `process-wave-payment` et `process-mobile-money-payment`
**Problème** : Pas de vérification de propriété de la commande. + `verify_jwt = false` !
**Correction** :
- Mettre `verify_jwt = true` dans config.toml
- Ajouter vérification ownership : `order.customer_id === user.id || businessAccount.user_id === user.id`

### 2.3 `friend_form_tokens` — tokens lisibles par tous
**Problème** : Policy SELECT avec `USING (true)` expose tous les tokens et user_ids.
**Correction** : Créer une fonction RPC `get_token_by_value(token text)` security definer et restreindre la policy.

### 2.4 `temp_password` exposé dans la réponse API
**Problème** : `admin-create-user` retourne le mot de passe temporaire dans le body.
**Correction** : Envoyer le password via WhatsApp/SMS et ne pas le retourner dans la réponse.

### 2.5 Policies `USING (true)` / `WITH CHECK (true)` (~20 occurrences)
**Problème** : Policies INSERT/UPDATE/DELETE trop permissives sur plusieurs tables.
**Correction** : Audit table par table pour remplacer par `auth.uid() = user_id` ou la condition appropriée.

### 2.6 Realtime — channels admin accessibles à tous
**Problème** : Pas de policy sur `realtime.messages`, tout utilisateur peut s'abonner aux channels admin.
**Correction** : Configurer les autorisations Realtime au niveau applicatif (filtrer côté broadcast/presence).

---

## PRIORITE 3 — Bonnes pratiques à appliquer

### 3.1 CORS — `Access-Control-Allow-Origin: *` sur 98 Edge Functions
**Correction** : Remplacer par les domaines autorisés :
```
'Access-Control-Allow-Origin': 'https://pixl-parade-page.lovable.app'
```
Exception : les fonctions webhook/preview/OG qui doivent rester publiques.

### 3.2 `verify_jwt = false` sur ~60 fonctions sensibles
**Correction** : Mettre `verify_jwt = true` pour toutes les fonctions qui traitent des données utilisateur (delete-business-cascade, admin-resend-otp, test-whatsapp-send, etc.). Garder `false` uniquement pour : webhooks, previews/OG, sitemaps, cron jobs.

### 3.3 Functions `search_path` mutable (~10 fonctions)
**Correction** : Ajouter `SET search_path = public` à toutes les fonctions SQL security definer.

### 3.4 Public buckets allow listing (~8 buckets)
**Correction** : Restreindre les policies SELECT sur `storage.objects` pour n'autoriser l'accès qu'aux fichiers spécifiques (par path) plutôt que le listing complet.

### 3.5 String interpolation dans les queries Supabase
**Correction** : Refactorer `BusinessInitiatedFundsSection.tsx` pour utiliser une RPC ou deux queries séparées au lieu d'interpoler dans `.or()`.

---

## PRIORITE 4 — Règles préventives (mémoire projet)

Sauvegarder vos règles de sécurité en mémoire projet pour que chaque futur développement les respecte automatiquement.

---

## Fichiers concernés

| Fichier/Ressource | Action |
|---|---|
| Migration SQL (nouvelle) | Corriger ~8 policies RLS critiques |
| `supabase/config.toml` | Mettre `verify_jwt = true` sur ~15 fonctions sensibles |
| ~10 Edge Functions | Restreindre CORS origins |
| `process-wave-payment/index.ts` | Ajouter ownership check |
| `process-mobile-money-payment/index.ts` | Ajouter ownership check |
| `send-whatsapp-otp/index.ts` | Ajouter rate limiting IP |
| `admin-create-user/index.ts` | Supprimer temp_password de la réponse |
| `src/components/BusinessInitiatedFundsSection.tsx` | Refactorer query .or() |
| `mem://security/security-rules` | Sauvegarder les règles en mémoire |

**Estimation** : Ce plan sera exécuté en plusieurs étapes de migration, en commençant par les vulnérabilités critiques. Aucune fonctionnalité existante ne sera altérée.

