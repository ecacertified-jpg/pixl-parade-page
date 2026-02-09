

# Permettre la saisie manuelle de la date d'anniversaire sur mobile

## Probleme actuel

Sur mobile, le composant `BirthdayPicker` utilise uniquement `<input type="date">` qui affiche le selecteur natif du systeme (roue iOS / calendrier Android). Les utilisateurs ne peuvent pas taper directement leur date au clavier.

## Solution

Remplacer le `<input type="date">` mobile par un champ texte avec auto-formatage `jj/mm/aaaa` (identique a la version desktop), accompagne d'une icone calendrier qui ouvre le selecteur natif en fallback.

## Approche technique

### Fichier : `src/components/ui/birthday-picker.tsx`

#### Modifier la version mobile pour utiliser un champ texte + selecteur natif cache

1. **Champ texte principal** : Afficher un `<Input>` avec placeholder `jj/mm/aaaa` et auto-formatage des chiffres (ajout automatique des `/`), exactement comme la version desktop actuelle.

2. **Input natif cache** : Garder un `<input type="date">` invisible (opacity-0, position absolute) derriere l'icone calendrier. Quand l'utilisateur clique sur l'icone, ca ouvre le selecteur natif du telephone comme option secondaire.

3. **Reutiliser la logique existante** : Les fonctions `handleInputChange` et `validateInput` sont deja implementees pour le desktop. On les reutilise pour le mobile en supprimant la condition `isMobile` qui separe les deux rendus.

#### Changement concret

Remplacer le bloc conditionnel `isMobile ? (...) : (...)` par un rendu unifie :
- Un champ texte `jj/mm/aaaa` avec auto-formatage (toujours visible)
- Une icone calendrier cliquable a droite
- Sur mobile : l'icone ouvre un `<input type="date">` cache pour offrir le selecteur natif en option
- Sur desktop : l'icone ouvre le `Popover` avec le composant `Calendar` (comportement actuel conserve)

### Impact

Ce changement s'applique automatiquement a tous les formulaires utilisant `BirthdayPicker` :
- `CompleteProfileModal` (onboarding)
- `ProfileSettings` (edition profil)
- `AddFriendModal` (ajout contact)
- `AddEventModal` (ajout evenement)

### Aucune modification necessaire dans les autres fichiers
Seul `src/components/ui/birthday-picker.tsx` est modifie.

