

## Diagnostic

### 1) Étape "Créer ma cagnotte" marquée "Fait" à tort

Dans `useBirthdayPageBuilderStatus.ts` (lignes 78-84), la requête vérifie l'existence d'**une** cagnotte `collective_funds` du user avec `occasion='birthday'` et `status='active'`. C'est bien lié à une vraie cagnotte en DB → donc en théorie correct.

Mais l'utilisateur signale que la cagnotte est marquée "Fait" sans qu'il l'ait créée. Causes possibles :
- Une cagnotte **existante précédemment** (créée via un autre flow : page d'anniversaire auto, lien partagé, etc.) est remontée comme "la cagnotte de cette page".
- Le filtre actuel `creator_id = userId` + `occasion='birthday'` matche **n'importe quelle** cagnotte d'anniversaire créée par ce user à un moment de sa vie sur la plateforme — pas spécifiquement celle liée à sa page d'anniversaire de l'année en cours.

→ Il faut **resserrer la condition** : ne marquer "fund done" que si la cagnotte est **explicitement liée** à la page d'anniversaire de l'année courante (via `birthday_pages.fund_id`) OU si elle a été créée après que le user a démarré le builder.

### 2) Pas de possibilité de skip

Aujourd'hui le bouton CTA est "Créer", mais il n'y a aucun moyen de passer l'étape sans la valider. L'utilisateur reste bloqué psychologiquement.

### 3) Modification/annulation de la cagnotte

Aujourd'hui : quand `fund.done`, le bouton devient "Voir" et navigue vers la fiche cagnotte. Aucune option pour modifier le montant ou annuler la cagnotte tant que personne n'a contribué.

Vérification DB nécessaire : `fund_contributions.count` pour le `fund_id` doit être 0 pour autoriser l'édition/annulation.

## Plan

### Fix 1 — Détection stricte de la cagnotte de la page

Dans `src/hooks/useBirthdayPageBuilderStatus.ts` :

- Récupérer `birthday_pages.fund_id` (déjà fait via `pageRes.data.fund_id`).
- Modifier la requête `fundRes` : si `page?.fund_id` existe, charger **cette** cagnotte précise (`.eq('id', page.fund_id).eq('status', 'active')`). Sinon, **ne pas marquer comme done** (laisser à l'utilisateur le soin de créer ou skipper).
- Ajouter un champ `fundContributionsCount` au statut, calculé via `fund_contributions.count` quand un fund est lié → exposé pour la logique d'édition/annulation.

### Fix 2 — Possibilité de passer l'étape "Créer ma cagnotte"

Dans `src/components/BirthdayPageBuilderModal.tsx` :

- Ajouter un état local `skippedFund` persisté dans `localStorage.bp_fund_skipped_${userId}` (boolean).
- Dans le rendu de l'étape `fund` :
  - Si `!s.fund.done && !skippedFund` : 2 boutons côte à côte : **"Créer"** (primary) + **"Passer"** (ghost/secondary, petit).
  - Si `!s.fund.done && skippedFund` : afficher un mini-badge gris "Passée" et un lien "Créer maintenant" pour revenir en arrière.
  - L'étape skippée **ne valide pas** le step (pas de ✅), mais **n'empêche pas** la progression vers Publier/Partager → la logique de `disabled` sur les étapes 5 & 6 ne dépend déjà pas du fund (uniquement de `pageType` et `publish.done`).

### Fix 3 — Modifier / annuler la cagnotte si aucun contributeur

Dans `BirthdayPageBuilderModal.tsx`, étape `fund` quand `s.fund.done === true` :

- Au lieu d'un seul bouton "Voir", afficher (si `fundContributionsCount === 0`) un menu contextuel ou 3 boutons :
  - **Voir** (link vers `/f/:id`)
  - **Modifier le montant** → ouvre un nouveau petit sub-Sheet `EditFundAmountSheet` avec un input numérique pré-rempli, validation `>= 1000 XOF`, update via `supabase.from('collective_funds').update({ target_amount }).eq('id', fundId)`.
  - **Annuler la cagnotte** → AlertDialog de confirmation, puis `update({ status: 'cancelled' }).eq('id', fundId)`. Après annulation, recalculer le statut → l'étape redevient non-validée et le bouton "Créer" (+ Passer) réapparaît.
- Si `fundContributionsCount > 0` : afficher un texte info `"X contribution(s) reçue(s) — modification verrouillée"` + uniquement bouton "Voir".

### Fichiers modifiés / créés

- `src/hooks/useBirthdayPageBuilderStatus.ts`
  - Lier `fund` à la page (`page.fund_id` strict) + ajouter `fundContributionsCount`.
- `src/components/BirthdayPageBuilderModal.tsx`
  - Logique skip + double bouton "Créer / Passer".
  - Étape `fund` validée : Voir / Modifier / Annuler selon `fundContributionsCount`.
  - Nouveau sub-Sheet `EditFundAmountSheet` (inline ou composant séparé).

### Mémoires à mettre à jour

- `mem://features/birthday-pages/lifecycle-and-visibility` : ajouter "L'étape 'Créer ma cagnotte' du builder est facultative (skippable). La cagnotte ne peut être modifiée ou annulée que si aucune contribution n'a été reçue."

## Résultat attendu

1. ✅ L'étape "Créer ma cagnotte" n'est marquée "Fait" que si la page de l'année courante a un `fund_id` actif lié.
2. ✅ Bouton "Passer" pour ignorer cette étape sans la valider — n'empêche pas Publier/Partager.
3. ✅ Quand une cagnotte est créée et qu'aucun ami n'a encore contribué : boutons **Voir / Modifier le montant / Annuler**.
4. ✅ Quand au moins 1 contribution existe : verrouillage + texte explicatif.

