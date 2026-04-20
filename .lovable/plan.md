

## Diagnostic

### Question 2 (réponse directe) : ❌ NON

La page d'anniversaire affichée dans le fil **n'affiche pas** la cagnotte créée par l'utilisateur, sauf cas exceptionnel.

**Preuve DB** : sur 20 pages d'anniversaire actives, **toutes ont `birthday_pages.fund_id = NULL`**, alors qu'une seule (Eca) a une cagnotte birthday active dans `collective_funds` côté créateur — et même elle n'est pas reliée. Le feed lit uniquement `birthday_pages.fund_id` via la jointure FK, donc la cagnotte créée à l'étape 2 de l'onboarding (`FundPickerModal`) **n'est jamais rattachée** à la page.

**Cause** : aucun code (front ni edge function) ne fait `UPDATE birthday_pages SET fund_id = ?` après création de la cagnotte. Recherche `\.update\(\{[^}]*fund_id` → 0 match.

### Question 1 : pages affichées trop tôt

Le feed (`usePagesFeed.ts` ligne 68) filtre uniquement `is_active = true`. Or `birthday_pages` est créée avec `is_active=true` à **trois endroits différents**, dont **deux automatiques avant validation onboarding** :

| Source | Quand | `is_active` initial |
|---|---|---|
| `Dashboard.tsx:218-263` (auto-create silencieux) | Dès l'arrivée sur le Dashboard | ✅ true |
| `birthday-wishes` edge function (cron) | J-3 anniversaire | ✅ true |
| `OnboardingExperience.tsx:483` (étape 6 « Créer ma page ») | Action explicite utilisateur | ✅ true |

Résultat : la page apparaît dans le fil **avant** que l'utilisateur ait validé l'étape 6 — exactement ce qu'on veut éviter.

## Plan

### Correctif 1 — Cacher la page du fil tant que « Créer ma page » n'est pas validée

**Approche** : ajouter une colonne `published_at TIMESTAMPTZ` à `birthday_pages` (NULL = brouillon, non publié). Le fil filtre `published_at IS NOT NULL`.

**Migration**
```sql
ALTER TABLE birthday_pages ADD COLUMN published_at timestamptz;
-- Backfill : pages déjà visibles dans le fil restent visibles
UPDATE birthday_pages SET published_at = created_at 
  WHERE is_active = true AND published_at IS NULL;
CREATE INDEX idx_birthday_pages_published ON birthday_pages(published_at) 
  WHERE published_at IS NOT NULL;
```

**Code**
- `Dashboard.tsx:247-263` — INSERT sans `published_at` (reste brouillon, accessible via lien direct mais invisible dans le fil).
- `birthday-wishes/index.ts:612` — INSERT cron : ne pas publier (l'utilisateur valide depuis l'onboarding).
- `OnboardingExperience.tsx:483` (`handleCreateBirthdayPage`) — INSERT **avec** `published_at: new Date().toISOString()` car c'est l'action explicite « Créer ma page » à l'étape 6.
- Si la page existe déjà (cas `existing`), faire un `UPDATE birthday_pages SET published_at = now() WHERE id = ? AND published_at IS NULL` pour la publier rétroactivement.
- `usePagesFeed.ts:68` — ajouter `.not('published_at', 'is', null)` au filtre birthday.

### Correctif 2 — Rattacher la cagnotte à la page après création

**Code**
- `OnboardingExperience.tsx` — dans `checkFundExists` (ligne 516) : quand un fund est détecté, faire :
  ```ts
  if (birthdayPageId && data.id) {
    await supabase.from('birthday_pages')
      .update({ fund_id: data.id })
      .eq('id', birthdayPageId)
      .is('fund_id', null);
  }
  ```
- Idem dans le `useEffect` de chargement initial (ligne 187) : si `pageRes.data` ET `fundRes.data` existent ET que la page n'a pas de `fund_id`, faire le rattachement (réparation rétroactive).
- Déclencher `window.dispatchEvent(new Event('feed-refresh'))` après le rattachement pour rafraîchir la carte avec la cagnotte visible.

**Backfill rétroactif** (migration)
```sql
UPDATE birthday_pages bp
SET fund_id = cf.id
FROM collective_funds cf
WHERE bp.fund_id IS NULL
  AND cf.creator_id = bp.user_id
  AND cf.occasion = 'birthday'
  AND cf.status = 'active'
  AND cf.deadline_date >= now();
```

### Mémoire à mettre à jour

`mem://features/birthday-pages/lifecycle-and-visibility` : préciser le nouveau contrat — `is_active=true` rend la page accessible par lien direct, mais seul `published_at IS NOT NULL` la fait apparaître dans le fil. Publication uniquement via l'action explicite « Créer ma page » (onboarding étape 6 ou bouton équivalent). La cagnotte créée à l'étape 2 est automatiquement rattachée à la page via `birthday_pages.fund_id`.

## Résultat

1. ✅ La page de l'utilisateur n'apparaît dans le fil que lorsque l'étape 6 « Créer ma page » est validée.
2. ✅ La cagnotte initiée par l'utilisateur s'affiche bien sur sa carte dans le fil dès la publication (et rétroactivement pour les pages déjà publiées).

