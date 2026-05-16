## Problème

WhatsApp met en cache l'aperçu OG **par URL publique exacte**, indéfiniment. Quand un utilisateur partage `…/birthday/<slug>` une première fois (avant qu'une photo d'album existe), WhatsApp mémorise l'image JDV par défaut. Même après ajout/sélection d'une photo et purge de cache via Graph API, WhatsApp ne re-scrape pas — il continue d'afficher l'image initialement mise en cache.

La fonction `birthday-preview` répond pourtant déjà correctement (vérifié : pour `ange-felicia--2026`, elle retourne bien l'URL de la photo d'album dans `og:image`).

## Solution

Versionner l'URL partagée avec un cache-buster qui change quand l'image de partage change. WhatsApp considérera alors qu'il s'agit d'une URL différente et re-scrapera.

### 1. Edge function `birthday-share-version` (nouvelle)

Petite fonction publique qui prend un `slug` et retourne le tag de version courant utilisé par `birthday-preview` (`updated_at` + 8 premiers car. de `social_share_photo_id`). Permet au frontend d'appeler une seule source de vérité.

Alternative plus légère : exposer la même logique directement côté frontend via une query Supabase (lecture de `birthday_pages.updated_at` + `social_share_photo_id`), sans nouvelle edge function. Recommandé : option client-side, plus simple.

### 2. Helper `buildBirthdayShareUrl(slug, page)` 

Utilitaire frontend qui construit :
```
https://joiedevivre-africa.com/birthday/<slug>?s=<versionTag>
```
où `versionTag` = `<unix(updated_at)>-<social_share_photo_id?.slice(0,8) ?? 'default'>` (même format que la version utilisée par `birthday-preview`).

À placer dans `src/utils/buildShareUrl.ts` (ou nouveau fichier dédié `src/utils/buildBirthdayShareUrl.ts` pour éviter de polluer).

### 3. Mettre à jour tous les points de partage de page anniversaire

Remplacer les constructions actuelles `…/birthday/${slug}` par `buildBirthdayShareUrl(slug, page)` dans :
- `BirthdayAlbum.tsx` (boutons partage WhatsApp, copie de lien)
- `BirthdayPage.tsx` (header share, partage social principal)
- `useFundShareCard` / autres helpers qui partagent des liens de cagnotte liée à une page d'anniversaire si concernés
- Toute carte « inviter à signer / partager l'album »

Auditer via `rg "/birthday/\$\{"` et `rg "buildShareUrl"`.

### 4. Côté `birthday-preview`

Aucune modification fonctionnelle nécessaire — la fonction ignore déjà les query params inconnus (le `slug` est extrait du path). Vérifier juste que le paramètre `?s=...` est bien transmis tel quel par les redirections (302 vers SPA pour humains : ajouter le param dans la `Location` pour éviter de le perdre).

### 5. Auto-déclenchement quand le user change la photo de partage

Quand `handleSetSocialCover` ou la validation auto modifie `social_share_photo_id` :
- `purge-birthday-og-cache` est déjà appelé (re-scrape FB/Graph)
- Ajouter en plus : toast informatif « Si vous aviez déjà partagé un lien sur WhatsApp, repartagez-le pour que la nouvelle image apparaisse » (WhatsApp ne re-scrape pas les anciens liens même versionnés).

### 6. Cas spécifique de Ange Felicia (correctif data ponctuel)

Optionnel : exécuter une migration ponctuelle qui, pour les pages où `social_share_photo_id IS NULL` mais une photo image existe, sélectionne la première photo comme `social_share_photo_id`. Cela améliore le rendu par défaut et stabilise le `versionTag`.

## Détails techniques

```text
URL avant : https://joiedevivre-africa.com/birthday/ange-felicia--2026
URL après : https://joiedevivre-africa.com/birthday/ange-felicia--2026?s=1778894574-6f8dfe74
```

- Quand l'owner change la photo → nouveau `versionTag` → nouvelle URL → WhatsApp re-scrape.
- Les humains qui cliquent voient le même contenu (le SPA ignore `?s=...`).
- Les crawlers reçoivent le HTML correct avec `og:image` à jour (déjà OK aujourd'hui).
- ETag/Cache-Control de la preview function restent valides car la version est déjà encodée dans l'ETag.

## Hors-scope

- Pas de modif de la cascade de fallback dans `birthday-preview` (déjà correcte).
- Pas de modif des retries `purge-birthday-og-cache` (déjà robuste).
- Pas de nouvelle table.

## Fichiers touchés

- `src/utils/buildBirthdayShareUrl.ts` (nouveau)
- `src/components/BirthdayAlbum.tsx` (partages)
- `src/pages/BirthdayPage.tsx` (partages + toast info)
- Audit des autres sites de partage `…/birthday/…`
- (optionnel) migration ponctuelle de backfill
