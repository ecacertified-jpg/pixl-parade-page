

## Diagnostic

Le bouton **+** (bottom bar) ouvre `CreateActionMenu.tsx`, un Sheet listant 5 actions. Aujourd'hui il propose "Créer une cagnotte" (qui ouvre `SearchExistingFundsModal`) mais **aucune entrée dédiée à la création/finalisation d'une page d'anniversaire** avec checklist visuelle.

Tous les éléments nécessaires existent déjà :
- Pages : `/wishlist-catalog` (souhaits), `/dashboard` section "Mon cercle d'amis", `/event/create?occasion=...` (autre événement)
- Modaux : `SearchExistingFundsModal` (cotiser pour autre), `WishlistFundPickerModal` (créer cagnotte depuis ses souhaits), `BirthdayPageShareButton` (partage)
- Logique de création de page : `handleCreateBirthdayPage` dans `OnboardingExperience.tsx` (à factoriser)
- Données de progression : table `birthday_pages` (existence, `published_at`, `published_via_onboarding`), `user_favorites` (souhaits), `friend_circle_members` (cercle), `collective_funds` (cagnotte birthday active), `onboarding_shares` (partages)

## Plan

### 1) Nouvelle entrée dans `CreateActionMenu`

Ajouter en **première position** un item :
- **Icône** : `Cake` (lucide), couleur `text-pink-500`
- **Label** : "Ma page d'anniversaire"
- **Description** : "Crée et complète ta page en 6 étapes"
- **Badge** : `"Nouveau"` si l'utilisateur n'a pas encore de page publiée, sinon nombre d'étapes restantes (ex. `2 / 6`)
- **Action** : ouvre la nouvelle modale `BirthdayPageBuilderModal`

### 2) Nouveau composant `BirthdayPageBuilderModal.tsx`

Modale plein écran (Sheet bottom sur mobile, Dialog sur desktop) avec :

**Header** : titre "Ma page d'anniversaire", barre de progression Radix `Progress` (X/6), confettis quand 6/6.

**Liste verticale de 6 cartes** (composant interne `StepCard`) — chacune avec :
- Pastille gauche : `Check` vert sur fond `bg-green-500` si validé, sinon numéro sur fond muted
- Titre + description courte
- Bouton d'action (CTA) à droite ; désactivé si étape verrouillée par une dépendance (ex. partage avant publication)
- État `done` : carte fond `bg-green-50 dark:bg-green-900/20 border-green-200`
- Badge `✅ Fait` quand validé

**Les 6 étapes** dans cet ordre :

| # | Titre | Validation (signal DB) | Action CTA |
|---|---|---|---|
| 1 | **Modifier ma liste de souhaits** | `user_favorites.count >= 3` | Navigue vers `/wishlist-catalog` (ferme la modale) |
| 2 | **Compléter mon cercle d'amis** | `friend_circle_members.count >= 3` (cercles du user) | Navigue vers `/dashboard#cercle` (scroll vers la section "Mon cercle d'amis") |
| 3 | **Choisir le type de page** | `localStorage.bp_type` ∈ {`self`, `friend`, `other_event`} | Ouvre un sous-écran 3 boutons radio : Pour moi-même / Pour un proche / Autre événement |
| 4 | **Créer ma cagnotte** | `collective_funds` actif `creator_id=user, occasion='birthday'` (type `self`) **ou** existence d'une cagnotte créée via flow correspondant | Selon choix étape 3 : `self` → `WishlistFundPickerModal` ; `friend`/`other_event` → `SearchExistingFundsModal` |
| 5 | **Publier ma page** | `birthday_pages` row pour `(user_id, current_year)` avec `published_at IS NOT NULL` ET `published_via_onboarding=true` | Pour `self` : appelle la même logique que `handleCreateBirthdayPage` (UPSERT page + `published_at=now()` + `published_via_onboarding=true` + `fund_id` lié). Pour `friend`/`other_event` : redirect `/event/create?occasion=...` |
| 6 | **Partager ma page** | `onboarding_shares.count >= 3` pour ce user | Ouvre `BirthdayPageShareButton` (Sheet existante) avec `pageUrl` calculée. Au close, on attend l'incrémentation des shares (déjà gérée ailleurs) |

**Verrouillage progressif** : étape 5 nécessite étapes 3 ; étape 6 nécessite étape 5. Les autres restent toujours accessibles (l'utilisateur peut compléter dans n'importe quel ordre).

### 3) Nouveau hook `useBirthdayPageBuilderStatus`

Charge en parallèle (similaire à `useOnboarding`) :
- `user_favorites` count
- `friend_circles` du user → puis `friend_circle_members` count
- `birthday_pages` (slug, published_at, published_via_onboarding) pour année courante
- `collective_funds` active birthday du user
- `onboarding_shares` count

Renvoie `{ steps: { wishlist, friends, type, fund, publish, share }, isLoading, refetch }` chaque entrée typée `{ done: boolean, value?: number, target?: number }`. Type de page lu/écrit via `localStorage.bp_type_${userId}`.

Utilise `useQuery` (key `['bp-builder', userId]`, staleTime 30s) ; refetch automatique après chaque action via `queryClient.invalidateQueries` et listener `feed-refresh`.

### 4) Pas de migration DB

Toutes les colonnes requises existent (`published_via_onboarding`, `published_at`, `onboarding_shares`, etc.).

### 5) Mémoires à mettre à jour

- `mem://auth/onboarding-experience-and-logic` : ajouter une note "Une entrée 'Ma page d'anniversaire' du Sheet `+` (CreateActionMenu) propose une checklist 6 étapes accessible à tout moment, complémentaire de l'onboarding bloquant."

## Résultat attendu

1. Le bouton `+` propose en premier une entrée "Ma page d'anniversaire".
2. Une modale affiche 6 étapes avec checkmark vert dès qu'une action est faite (souhaits ≥3, cercle ≥3 amis, type choisi, cagnotte créée, page publiée, partages ≥3).
3. Chaque étape pointe vers la page/modale existante adaptée au type de page choisi.
4. La progression est calculée en temps réel depuis Supabase, sans toucher à la DB.

