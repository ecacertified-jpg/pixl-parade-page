## Diagnostic

### Problème 1 — Pages d'anniversaire absentes du fil

**Vérification DB** (30 dernières pages) :
- ✅ **Samira** (`samira-2026`) : `published_at = 2026-04-23 22:47`, `published_via_onboarding = true` → visible.
- ❌ **Anne-Marie**, **Flore**, **Reine**, **Phanuel**, **Sangare**, **Daniel**, **Dieudonné**, etc. : `published_at = null`, `published_via_onboarding = false` → **invisibles** dans le fil (filtre `usePagesFeed` : `is_active = true AND published_at IS NOT NULL`).

**Cause** : ces pages ont été créées automatiquement par :
- `Dashboard.tsx` (à la connexion, pour assurer une page par an)
- Le cron `birthday-wishes` (J-3 avant l'anniversaire)

Elles sont **brouillons** par design — la mémoire stipule que seul un appui explicite sur « Créer ma page » (étape 6) les publie. Anne-Marie, Flore, etc. ne sont pas allées jusqu'au bout du builder.

**Décision** : laisser le filtre brouillon/publié intact pour les pages existantes, mais **abaisser le seuil de friction** pour que ces utilisateurs publient. Deux actions complémentaires :

1. **Bandeau "Publier ma page" sur `WhatDoYouWantCard`** (visible uniquement si l'utilisateur a une page brouillon non publiée) : 1 clic = publication directe + confetti, sans rouvrir tout le builder.
2. **Backfill ciblé** (optionnel) : pour les pages auto-créées récemment où l'utilisateur a explicitement interagi avec son builder (ex. `fund_id != null` ou album non vide), publier rétroactivement. Sans interaction, on ne publie pas — c'est une page fantôme.

### Problème 2 — Bouton retour absent depuis l'avatar

Dans `BirthdayPage.tsx` (ligne 310), le bouton « Retour au fil » ne s'affiche que si `location.state?.fromFeed === true`. Or `WhatDoYouWantCard` (ligne 122) navigue avec `navigate(\`/birthday/${myPageSlug}\`)` **sans state**.

**Fix** : passer un state explicite (`fromFeed: true` ou `from: 'home'`) lors du clic sur l'avatar, et garder l'affichage du bouton sous la même condition.

### Problème 3 — Libellés et compteurs des actions de carte

Dans `FeedCardActions.tsx` :
- Ligne 23 : `label: "Cadeau"` → à renommer en **"Promesse"**.
- Lignes 20-21 : Vidéo et Souvenir ont déjà un `countKey` (`video_count`, `memory_count`) câblé.

**Vérification de la chaîne de données** dans `usePagesFeed.ts` :
- Ligne 152 : `videoCount = photos.filter(p => p.media_type === 'video').length` ✅
- Ligne 153 : `memoryCount = photos.filter(p => p.media_type === 'text').length` ✅
- Ligne 161 : passés dans `feedPages.push({ ..., video_count, memory_count })` ✅

Les compteurs sont déjà calculés et passés. **Le badge devrait déjà s'afficher** dès qu'une vidéo ou un souvenir existe (cf. `FeedCardActions.tsx` ligne 232 : `{count > 0 && ...}`). Si l'utilisateur ne les voit pas, c'est probablement parce qu'aucune vidéo / souvenir n'a encore été uploadée sur les pages affichées.

**Action** : aucune modification nécessaire pour les compteurs eux-mêmes. Juste renommer "Cadeau" → "Promesse" et confirmer le comportement.

## Plan

### Fix 1 — Faciliter la publication des pages brouillons

**Nouveau composant** `src/components/PublishMyBirthdayPageBanner.tsx` :
- Hook qui récupère la page brouillon de l'utilisateur connecté pour `celebration_year = currentYear` (`is_active = true AND published_at IS NULL`).
- Si trouvée : afficher un bandeau compact (au-dessus ou sous l'avatar dans `WhatDoYouWantCard`) avec :
  - Texte : « Ta page d'anniversaire est prête mais non publiée. **Publie-la** pour qu'elle apparaisse dans le fil. »
  - Bouton CTA : **"Publier maintenant"** → `UPDATE birthday_pages SET published_at = now(), published_via_onboarding = true` + confetti + `dispatchEvent('feed-refresh')` + toast.
- Disparaît dès que `published_at IS NOT NULL`.

Cela règle le problème pour Anne-Marie, Flore, Reine et tous les futurs utilisateurs qui ont une page brouillon.

### Fix 2 — Bouton retour depuis l'avatar de `WhatDoYouWantCard`

`src/components/WhatDoYouWantCard.tsx` ligne 122 :
```tsx
onClick={() => navigate(`/birthday/${myPageSlug}`, { state: { fromFeed: true } })}
```

Aucune modif côté `BirthdayPage.tsx` (la condition `fromFeed` existe déjà, ligne 310).

### Fix 3 — Libellé "Cadeau" → "Promesse" + confirmation des compteurs

`src/components/FeedCardActions.tsx` ligne 23 :
```ts
{ key: "cadeau", icon: Gift, label: "Promesse", countKey: "gift_promise_count" },
```

Pour les compteurs **Vidéo** et **Souvenir** : aucun changement de code requis — la logique d'affichage (`count > 0`) et la chaîne de calcul depuis `usePagesFeed` sont déjà correctes. Le badge apparaîtra automatiquement dès qu'une vidéo ou un texte de souvenir sera uploadé sur la page.

### Fichiers modifiés / créés

- **créé** : `src/components/PublishMyBirthdayPageBanner.tsx` — bandeau de publication 1-clic.
- **créé** : `src/hooks/useMyDraftBirthdayPage.ts` — hook qui détecte la page brouillon de l'année courante.
- **édité** : `src/components/WhatDoYouWantCard.tsx` — intégrer le bandeau + ajouter `state: { fromFeed: true }` sur le clic avatar.
- **édité** : `src/components/FeedCardActions.tsx` — renommer "Cadeau" → "Promesse".

### Mémoire à mettre à jour

`mem://features/birthday-pages/lifecycle-and-visibility` : ajouter « Un bandeau **PublishMyBirthdayPageBanner** sur la page d'accueil propose à l'utilisateur de publier en 1 clic sa page d'anniversaire si elle existe en brouillon (auto-créée par Dashboard ou cron). Cette action pose `published_at = now()` + `published_via_onboarding = true` au même titre que l'étape 6 de l'onboarding. »

## Résultat attendu

1. ✅ Anne-Marie, Flore, Reine et autres voient un bandeau « Ta page est prête — Publier maintenant » sur l'accueil → 1 clic et leur page apparaît dans le fil.
2. ✅ Le clic sur l'avatar de la `WhatDoYouWantCard` mène à la page perso avec un bouton **« ← Retour au fil »** visible en haut.
3. ✅ Sur chaque carte du fil, l'icône cadeau s'intitule désormais **« Promesse »**. Les badges compteurs (Vidéo, Souvenir, Promesse, Photo) s'affichent automatiquement dès qu'au moins un élément du type est ajouté.
