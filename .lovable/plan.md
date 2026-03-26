

# Plan : Pré-remplir le montant Wave pour les contributions

## Problème

Dans `ContributionModal.tsx` (ligne 609), `freeAmount={true}` est codé en dur. Cela envoie l'utilisateur vers Wave **sans le montant**, l'obligeant à le ressaisir manuellement. Or le montant de la contribution est connu (saisi dans le modal).

Le `freeAmount=true` avait été prévu pour la **création** de cagnottes (où le montant collectif est variable), mais pour une **contribution individuelle**, le montant est fixe.

## Changement — `src/components/ContributionModal.tsx`

Passer `freeAmount={false}` au lieu de `true` (ligne 609). Le composant `WavePaymentRedirect` ajoutera automatiquement `?amount=1000` à l'URL Wave, pré-remplissant le montant.

## Changement — `src/pages/CollectiveCheckout.tsx`

Même correction : passer `freeAmount={false}` (ligne 551). Lors de la création d'une cagnotte, le montant total est aussi connu.

## Fichiers modifiés

- `src/components/ContributionModal.tsx`
- `src/pages/CollectiveCheckout.tsx`

