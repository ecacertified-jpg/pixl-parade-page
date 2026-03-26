

# Plan : Ouvrir le modal de contribution directement depuis FundPreview

## Problème

`handleContribute` dans `FundPreview.tsx` (ligne 144) redirige vers `/dashboard?tab=cotisations` au lieu d'ouvrir le modal de contribution sur place. L'utilisateur perd le contexte de la cagnotte.

## Changement — `src/pages/FundPreview.tsx`

1. Importer `ContributionModal`
2. Ajouter un state `showContributionModal` (boolean, default false)
3. Modifier `handleContribute` :
   - Si l'utilisateur est connecté → `setShowContributionModal(true)`
   - Si non connecté → rediriger vers `/auth?redirect=/f/${fundId}`
4. Rendre `<ContributionModal>` en bas du composant avec les props du fund courant (`fundId`, `fundTitle`, `targetAmount`, `currentAmount`, `currency`)
5. Au `onSuccess` du modal, rafraîchir les données du fund (re-fetch)

## Fichier modifié

- `src/pages/FundPreview.tsx`

