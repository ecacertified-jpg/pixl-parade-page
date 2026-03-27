

# Plan : Corriger les 3 problèmes résiduels dans `birthday-wishes`

## Problèmes identifiés

| # | Problème | Cause | Impact |
|---|----------|-------|--------|
| 1 | `scheduled_notifications` insert échoue | Colonne `delivery_methods` (NOT NULL, pas de défaut) manquante dans les inserts | Aucune notification in-app créée |
| 2 | `birthday_celebrations` insert échoue | FK vers `auth.users(id)` mais le code utilise `user.id` (= `profiles.id`, pas `auth.users.id`) | Pas de célébration enregistrée |
| 3 | WhatsApp erreur #132018 | Le template `joiedevivre_birthday_countdown` dans Meta a un CTA statique (pas de `{{1}}` dynamique dans l'URL), mais le code envoie `['wishlist-catalog']` comme `buttonParameters` | Template rejeté par Meta |

## Corrections

### 1. Ajouter `delivery_methods` aux inserts `scheduled_notifications`

**Fichier** : `supabase/functions/birthday-wishes/index.ts`

4 inserts concernés (lignes ~229, ~325, ~513) — ajouter `delivery_methods: ['in_app']` à chaque insert.

### 2. Utiliser `user_id` au lieu de `id` pour `birthday_celebrations`

**Fichier** : `supabase/functions/birthday-wishes/index.ts`

Ligne ~433 : remplacer `user_id: user.id` par `user_id: user.user_id` dans l'insert `birthday_celebrations`, car la FK pointe vers `auth.users(id)` et `user.user_id` correspond à l'UUID auth.

Même correction pour les queries qui utilisent `user.id` au lieu de `user.user_id` dans la section D-Day (lignes ~418, ~444, ~447, ~481, ~490, ~500, ~554).

### 3. Supprimer les `buttonParameters` pour le template countdown

**Fichier** : `supabase/functions/birthday-wishes/index.ts`

Ligne ~253 : remplacer `['wishlist-catalog']` par `undefined` car le CTA du template `joiedevivre_birthday_countdown` est une URL statique dans Meta (pas de suffixe dynamique).

## Fichier modifié

- `supabase/functions/birthday-wishes/index.ts` — ~10 corrections dans le fichier

## Résultat attendu

La Edge Function s'exécutera sans erreur et :
1. Les notifications in-app seront créées correctement
2. Les célébrations seront enregistrées dans `birthday_celebrations`
3. Les templates WhatsApp seront acceptés par Meta

