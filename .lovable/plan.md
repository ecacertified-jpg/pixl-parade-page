

# Plan : Corriger le 404 sur le bouton "Contribuer" des cagnottes existantes

## Problème

Quand l'utilisateur clique sur "Contribuer" dans l'alerte de cagnotte existante, la navigation va vers `/collective-fund/${fundId}` — une route qui **n'existe pas** dans `App.tsx`. D'où le 404.

La bonne route est `/f/${fundId}` (page `FundPreview`), qui affiche la cagnotte et permet de contribuer.

## Changements

Remplacer `navigate(\`/collective-fund/${fundId}\`)` par `navigate(\`/f/${fundId}\`)` dans **3 fichiers** :

1. **`src/components/CollaborativeGiftModal.tsx`** (ligne 144)
2. **`src/components/BusinessCollaborativeGiftModal.tsx`** (ligne 116)
3. **`src/components/SearchExistingFundsModal.tsx`** (ligne 36)

## Fichiers modifiés

- `src/components/CollaborativeGiftModal.tsx`
- `src/components/BusinessCollaborativeGiftModal.tsx`
- `src/components/SearchExistingFundsModal.tsx`

