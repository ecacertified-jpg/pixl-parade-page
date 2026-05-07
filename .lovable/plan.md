## Objectif

Sur mobile, remplacer l'input `<input type="date">` natif par le même calendrier popover avec dropdowns Mois / Année déjà utilisé sur desktop (visible dans la capture fournie). Cela unifie l'expérience de sélection de date sur toute l'app, partout où `BirthdayPicker` est utilisé (Auth, ProfileSettings, FillFriendForm, AddFriendModal, AddEventModal, CompleteProfileModal, OnboardingExperience étape 2, CreateSurpriseFundModal, admin/UnifyClientAccountsModal).

## Changements

### `src/components/ui/birthday-picker.tsx`
- Supprimer la branche `isMobile` qui rend l'`<input type="date">` natif.
- Toujours rendre le `Popover` + `<Calendar captionLayout="dropdown-buttons">` (avec dropdowns mois et année), aussi bien sur desktop que sur mobile.
- Garder l'input texte `jj/mm/aaaa` à gauche (saisie clavier) inchangé.
- Garder `useIsMobile` uniquement si nécessaire pour ajuster le `align` du `PopoverContent` sur mobile (par ex. `align="center"` sur mobile pour éviter le débordement à droite sur petits écrans), sinon le supprimer.
- Nettoyer le handler `handleNativeDateChange` et les variables `nativeInputValue`, `minDate`, `maxDate` devenues inutiles.

### Vérifications
- Tester visuellement le picker sur la viewport mobile (375px) : le popover doit afficher les dropdowns Mois (« mai ») et Année (« 2026 ») comme sur la capture, et rester dans l'écran.
- Vérifier qu'aucun autre composant n'importe les variables/handlers retirés.

Aucun changement de logique métier, uniquement présentation du picker.