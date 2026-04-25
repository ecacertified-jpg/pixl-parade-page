---
name: Sélecteur de date unifié
description: BirthdayPicker est l'unique sélecteur de date pour tous les formulaires (anniversaires, dates de révélation, etc.)
type: preference
---
Tout formulaire qui demande à l'utilisateur (ou admin) de choisir une date unique doit utiliser `BirthdayPicker` (`src/components/ui/birthday-picker.tsx`).

Ce composant fournit :
- Un champ texte avec saisie clavier auto-formatée (jj/mm/aaaa) et validation en direct
- Un bouton calendrier avec popover contenant des dropdowns Mois/Année (desktop) ou un input `<input type="date">` natif (mobile)
- Les états visuels : succès (vert), erreur (rouge), helper text
- Les options : `disableFuture`, `disablePast`, `minYear`, `maxYear`, `label`, `helperText`, `placeholder`, `required`

**Ne plus jamais** combiner manuellement `Popover` + `<Calendar>` + bouton avec `CalendarIcon` pour un sélecteur de date unique dans un formulaire — utiliser `BirthdayPicker`.

Exceptions autorisées (sélecteurs de plages / périodes, hors formulaires utilisateur) :
- `src/components/ui/date-range-picker.tsx`
- `src/components/admin/PeriodSelector.tsx`

Écrans qui utilisent `BirthdayPicker` : Auth, ProfileSettings, FillFriendForm, AddFriendModal, AddEventModal, CompleteProfileModal, OnboardingExperience (étape 2), CreateSurpriseFundModal (date de révélation), admin/UnifyClientAccountsModal.