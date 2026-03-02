
# Intégrer les suggestions intelligentes dans "Mon cercle d'amis"

## Objectif
Ajouter la section `UserSuggestionsSection` (suggestions basees sur amis d'amis, interets communs, activite) directement dans l'onglet "Mon cercle d'amis" du Dashboard, entre les demandes d'amis et la liste de contacts.

## Changements

### 1. `src/pages/Dashboard.tsx`
- Importer `UserSuggestionsSection`
- L'inserer apres le composant `FriendshipSuggestionsCard` (ligne ~806), juste avant la liste des contacts filtres
- Cela place les suggestions intelligentes dans un ordre logique :
  1. Demandes d'amis recues (`FriendRequestsNotification`)
  2. Relations a confirmer (`FriendshipSuggestionsCard`)
  3. **Suggestions intelligentes** (`UserSuggestionsSection`) -- NOUVEAU
  4. Liste des contacts existants

### 2. `src/components/UserSuggestionsSection.tsx`
- Ajouter une prop optionnelle `compact?: boolean` pour permettre un affichage plus leger dans le Dashboard (sans la section vide elaboree quand il n'y a pas de suggestions)
- En mode compact : si aucune suggestion, ne rien afficher du tout (pas de carte vide avec conseils)
- Reduire le padding/espacement en mode compact pour s'integrer visuellement dans l'onglet amis

Aucune modification de base de donnees ou de hook necessaire -- toute la logique de suggestions existe deja dans `useUserSuggestions`.
