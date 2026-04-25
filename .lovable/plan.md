## Objectif

Unifier le sélecteur de date dans toute l'application en utilisant le même modèle de calendrier que celui de l'étape 2 (date d'anniversaire) de l'onboarding — c'est-à-dire un calendrier avec menus déroulants Mois/Année, navigation rapide, et un champ de saisie clavier (jj/mm/aaaa).

## État actuel

Le composant unifié **`BirthdayPicker`** (`src/components/ui/birthday-picker.tsx`) existe déjà et correspond exactement au modèle souhaité : champ texte + bouton calendrier + popover avec dropdowns Mois/Année (sur desktop) ou input date natif (sur mobile). Il est déjà utilisé dans : Auth, ProfileSettings, FillFriendForm, AddFriendModal, AddEventModal, CompleteProfileModal.

Trois écrans utilisent encore l'ancien modèle (petite icône calendrier + popover Calendar brut, sans dropdowns Mois/Année cohérents) :

1. **`OnboardingExperience.tsx`** (étape 2) — paradoxalement, l'étape référencée par l'utilisateur n'utilise PAS encore `BirthdayPicker` ; c'est le composant `Calendar` brut dans un Popover.
2. **`CreateSurpriseFundModal.tsx`** — champ « Date de révélation » de la cagnotte surprise.
3. **`admin/UnifyClientAccountsModal.tsx`** — champ « Date d'anniversaire » dans la recherche admin de doublons.

## Changements

### 1. `src/components/OnboardingExperience.tsx` — étape 2 anniversaire
Remplacer le bloc Popover + Button + Calendar (lignes 839–861) par `<BirthdayPicker>`. Conserver le titre, le sous-titre et les messages d'aide existants. Garder `disableFuture`, `minYear={1920}`, plage actuelle.

### 2. `src/components/CreateSurpriseFundModal.tsx` — date de révélation
Remplacer le Popover/Calendar par `<BirthdayPicker>` configuré pour une date future :
- `disableFuture={false}`, `disablePast={true}`
- `minYear={new Date().getFullYear()}`, `maxYear={new Date().getFullYear() + 5}`
- `label="Date de révélation"`, placeholder adapté.

### 3. `src/components/admin/UnifyClientAccountsModal.tsx` — recherche admin
Remplacer par `<BirthdayPicker>` standard (anniversaire : `disableFuture`, `minYear={1920}`).

### 4. Vérifications hors périmètre
- `date-range-picker.tsx`, `PeriodSelector.tsx` (admin) : sélecteurs de **plages de dates** (analytics, périodes) — pas concernés, ce ne sont pas des sélecteurs de date unique pour formulaires utilisateur.
- Composants déjà sur `BirthdayPicker` : aucun changement.

## Détails techniques

- Aucune modification de la base de données ni des types.
- Aucune migration, aucune dépendance ajoutée.
- `BirthdayPicker` accepte déjà `disableFuture` / `disablePast` / `minYear` / `maxYear` / `label` / `placeholder` / `helperText`, ce qui couvre les trois cas.
- Sur mobile, `BirthdayPicker` bascule automatiquement sur l'input `<input type="date">` natif, ce qui correspond aux bonnes pratiques mobile-first du projet.
- Comportement homogène : validation en direct (jour/mois/année), messages d'erreur, état de succès vert.

## Mémoire

Ajouter une mémoire `mem://ui/unified-birthday-picker` documentant que `BirthdayPicker` est l'unique sélecteur de date à utiliser pour tout champ de date dans les formulaires (anniversaires, dates de révélation, etc.), et que les Popover+Calendar bruts sont réservés aux sélecteurs de plage / analytics.