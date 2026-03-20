

# Plan : Déplacer l'avertissement dans le modal + restaurer le bouton Ajouter

## Changements

### 1. Supprimer l'avertissement du Dashboard (`src/pages/Dashboard.tsx`)

- Supprimer le bloc warning (lignes 688-710) : le `showFriendWarning` state, le bloc destructive, et le bouton "Voir l'avertissement"
- Supprimer les imports `Eye`, `EyeOff` s'ils ne sont plus utilisés
- **Restaurer le bouton "Ajouter"** dans le header "Mon cercle d'amis" (ligne 684-686) : ajouter un `Button` avec icône `UserPlus` qui ouvre `setShowAddFriendModal(true)`

### 2. Remplacer le message info par l'avertissement dans le modal (`src/components/AddFriendModal.tsx`)

- Remplacer le bloc `Alert` info (lignes 205-221) contenant les 3 messages (téléphones distincts, chances cadeaux, sous-cercles) par l'avertissement rouge :
  - `Alert variant="destructive"` avec le texte : "⚠️ Attention ! Ajoute les personnes que tu connais à ton cercle d'amis. Si elles ne te connaissent pas, elles pourraient hésiter à t'offrir des cadeaux."

## Fichiers modifiés

- `src/pages/Dashboard.tsx` — supprimer warning + restaurer bouton Ajouter
- `src/components/AddFriendModal.tsx` — remplacer info par avertissement rouge

