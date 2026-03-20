

# Plan : Alerte pulsante sur le bouton "Ajouter mes amis" + passage à 3 amis minimum

## Changements

### 1. Passer le minimum de contacts de 2 à 3 (`src/hooks/useFriendsCircleReminder.ts`)

Modifier `MINIMUM_CONTACTS = 2` → `MINIMUM_CONTACTS = 3` (ligne 8).

### 2. Ajouter l'alerte rouge + message sous le titre (`src/components/FriendsCircleReminderCard.tsx`)

Reproduire le pattern de `FavoriteArticlesSection` :

- Ajouter un bloc `Alert variant="destructive"` sous le titre "Encore {n} ami(s)" avec le texte :
  - **En style alerte** : "⚠️ Alerte ! Ajoute au moins 3 amis dans ton cercle d'amis pour désactiver cette alerte."
  - **En dessous, texte plus petit** : "Complète ton cercle d'amis pour profiter de la générosité de tes proches."
- Appliquer `animate-pulse` sur la bordure de la Card (comme la wishlist)
- Appliquer `animate-bounce` + `shadow-lg` sur le bouton "Ajouter mes amis" (comme le bouton "Parcourir" de la wishlist)
- Remplacer le `subtitle` actuel par le nouveau bloc alerte

### Fichiers modifiés

- `src/hooks/useFriendsCircleReminder.ts` — `MINIMUM_CONTACTS = 3`
- `src/components/FriendsCircleReminderCard.tsx` — alerte + style bouton pulsant

