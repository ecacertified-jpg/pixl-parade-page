---
name: birthday-pages-lifecycle-and-visibility
description: Cycle de vie des pages d'anniversaire, conditions de publication dans le fil et rattachement automatique de la cagnotte
type: feature
---
Une page `birthday_pages` peut exister sans être visible dans le fil d'actualités (`/`).

**Champ `is_active`** : la page est accessible via lien direct (`/birthday/:slug`) — auto-créée par `Dashboard.tsx`, le cron `birthday-wishes` (J-3) et l'onboarding étape 6.

**Champ `published_at`** (NOUVEAU) : NULL = brouillon (invisible dans le fil), TIMESTAMPTZ = publiée (visible dans le fil). Le hook `usePagesFeed.ts` filtre `is_active=true AND published_at IS NOT NULL`.

**Publication** : uniquement via l'action explicite « Créer ma page » (étape 6 onboarding, `handleCreateBirthdayPage`). Si la page existe déjà en brouillon, elle est publiée rétroactivement (`UPDATE published_at = now() WHERE published_at IS NULL`).

**Rattachement cagnotte → page** : la cagnotte créée à l'étape 2 (`FundPickerModal`) est automatiquement liée à la page via `birthday_pages.fund_id` :
- À la création de la page (étape 6) : `fund_id` est inséré directement si déjà connu.
- Au polling après fermeture de `FundPickerModal` (`checkFundExists`) : `UPDATE` du `fund_id` sur la page existante.
- À l'ouverture de l'onboarding (`useEffect` initial) : réparation rétroactive si page+fund existent mais non liés.
- Backfill SQL exécuté pour relier toutes les cagnottes birthday actives existantes.

Après tout rattachement, `window.dispatchEvent(new Event('feed-refresh'))` est déclenché pour rafraîchir la carte avec la cagnotte visible.
