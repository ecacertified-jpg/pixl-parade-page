

## Diagnostic

### 1) Pourquoi plusieurs pages d'Aboutou WhatsApp dans le fil ?

**18 pages d'anniversaire actives** existent pour Aboutou WhatsApp (user `3fc4a030…`), toutes pour `celebration_year=2026`, créées entre le 06/04 et le 14/04 par les mécanismes auto (Dashboard `useEffect`, cron `birthday-wishes`, possibles tests onboarding).

**Cause racine** : la migration précédente (correctif visibilité fil) a fait un backfill généreux :
```sql
UPDATE birthday_pages SET published_at = created_at WHERE is_active = true AND published_at IS NULL;
```
→ **toutes** les pages auto-créées (qui n'auraient jamais dû apparaître) ont été publiées rétroactivement. Aboutou en avait 18 → 18 cartes dans le fil.

### 2) Les pages "Créer ma page" (étape 6) s'affichent-elles prioritairement ?

**Non.** Le tri actuel dans `usePagesFeed.ts` (lignes 216-225) est :
1. Pages de l'utilisateur connecté en premier
2. Pages avec contenu (album, cover, fund)
3. Tri par `created_at DESC`

Aucune notion de "publiée explicitement via étape 6". Toutes les pages avec `published_at IS NOT NULL` sont traitées à égalité.

### 3) Liste admin tronquée à 4

**10 admins en DB** (2 super_admins + 7 modérateurs actifs + 1 admin sans nom). Le modal `AssignUserToAdminModal` exclut les super_admins (correct) → 8 admins éligibles. Mais :
- Le `ScrollArea` a une hauteur max de `420px` qui n'affiche que ~4 cartes sur mobile **sans aucun indicateur visuel** qu'il faut scroller à l'intérieur de la modale (pas de compteur, pas de bordure de scroll, pas de chevron).
- L'utilisateur ne sait pas qu'il y a plus d'admins en dessous.

## Plan

### Correctif 1 — Nettoyer les doublons et marquer "publié manuellement"

**Migration DB** :
```sql
-- 1) Ajouter une colonne pour distinguer publication explicite vs backfill
ALTER TABLE birthday_pages 
  ADD COLUMN published_via_onboarding boolean NOT NULL DEFAULT false;

-- 2) Dépublier TOUTES les pages publiées par le backfill précédent 
--    (= pages sans album, sans cover, sans fund_id — clairement auto-créées)
UPDATE birthday_pages
SET published_at = NULL
WHERE published_at IS NOT NULL
  AND published_via_onboarding = false
  AND fund_id IS NULL
  AND cover_image_url IS NULL
  AND id NOT IN (SELECT DISTINCT page_id FROM birthday_page_photos WHERE page_id IS NOT NULL);

-- 3) Pour chaque user/year ayant plusieurs pages publiées résiduelles, 
--    garder uniquement la plus ancienne (la "vraie") et dépublier les autres
WITH ranked AS (
  SELECT id, user_id, celebration_year, published_at,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, celebration_year 
           ORDER BY (fund_id IS NOT NULL) DESC, 
                    (cover_image_url IS NOT NULL) DESC,
                    created_at ASC
         ) AS rn
  FROM birthday_pages
  WHERE published_at IS NOT NULL AND is_active = true
)
UPDATE birthday_pages SET published_at = NULL
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 4) Désactiver les pages dupliquées totalement vides 
--    (garde 1 seule page brouillon par user/year)
WITH dupes AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, celebration_year 
    ORDER BY created_at ASC
  ) rn
  FROM birthday_pages
  WHERE is_active = true 
    AND published_at IS NULL 
    AND fund_id IS NULL 
    AND cover_image_url IS NULL
    AND id NOT IN (SELECT DISTINCT page_id FROM birthday_page_photos WHERE page_id IS NOT NULL)
)
UPDATE birthday_pages SET is_active = false WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 5) Empêcher les doublons à la source : index unique sur (user_id, celebration_year) 
--    parmi les pages actives
CREATE UNIQUE INDEX idx_birthday_pages_user_year_active 
  ON birthday_pages (user_id, celebration_year) 
  WHERE is_active = true;
```

**Code** :
- `src/components/OnboardingExperience.tsx` (`handleCreateBirthdayPage`) : à la création, mettre `published_via_onboarding: true` ET `published_at: now()`. Pour les pages existantes publiées rétroactivement à l'étape 6, faire un UPDATE qui passe les deux flags.
- `src/pages/Dashboard.tsx` (auto-create) : avant `INSERT`, faire un `SELECT id WHERE user_id=? AND celebration_year=?` (toutes pages, pas seulement actives) — si une page existe déjà (publiée ou brouillon), la réutiliser. Plus de `INSERT` qui pourrait créer un doublon.
- `supabase/functions/birthday-wishes/index.ts` : même logique de réutilisation avant insert.

### Correctif 2 — Tri du fil : pages publiées via onboarding en priorité

`src/hooks/usePagesFeed.ts` :
- Sélectionner aussi `published_via_onboarding`.
- Modifier le tri : 
  1. Pages de l'utilisateur connecté
  2. **Pages publiées via onboarding (`published_via_onboarding=true`)**
  3. Pages avec contenu
  4. `created_at DESC`

### Correctif 3 — Modal "Affecter à un admin" : afficher tous les admins

`src/components/admin/AssignUserToAdminModal.tsx` :
- Ajouter un compteur dans le header : `« 8 admins disponibles »`.
- Ajouter une barre de recherche (input) au-dessus du `ScrollArea` pour filtrer par nom/pays (utile dès qu'il y a >5 admins).
- Augmenter `max-h-[420px]` → `max-h-[55vh]` pour mieux utiliser l'espace mobile.
- Ajouter un indicateur visuel "scrollable" : ombre/dégradé en bas de la liste si elle dépasse + texte `« Faites défiler pour voir tous les admins »` quand plus de 4 résultats.
- Afficher également une indication du tri (par nombre d'utilisateurs assignés croissant → l'admin le moins chargé en premier, pour équilibrer la charge).

### Mémoires à mettre à jour

- `mem://features/birthday-pages/lifecycle-and-visibility` : préciser que **seul `published_via_onboarding=true` (ou `published_at` défini par action explicite)** rend une page visible dans le fil. Index unique `(user_id, celebration_year) WHERE is_active`. Réutilisation systématique des pages existantes.

## Résultat attendu

1. ✅ Aboutou WhatsApp n'aura plus qu'**une seule** carte dans le fil (la plus ancienne / celle avec contenu).
2. ✅ Les pages explicitement créées via "Créer ma page" (étape 6) seront affichées **en priorité** juste après celles de l'utilisateur connecté.
3. ✅ Toutes les pages auto-créées (Dashboard / cron) sans contenu sont retirées du fil ; un index unique empêche la création de nouveaux doublons.
4. ✅ Le Super Admin voit **les 8 admins éligibles** dans la modale d'affectation, avec recherche, compteur et indicateur de scroll.

