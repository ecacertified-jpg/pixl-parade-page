

# Plan : Félicitation à la complétion de la wishlist (≥3 produits)

## Objectif

Quand l'utilisateur atteint 3 produits dans sa liste de souhaits (et qu'il avait précédemment l'alerte d'urgence active), afficher une animation de célébration avec un message indiquant que son profil est prêt pour rappeler ses proches les événements importants.

## Changements

### Fichier : `src/components/FavoriteArticlesSection.tsx`

- Ajouter un state `useState` + `useEffect` pour détecter la **transition** de `< 3` à `≥ 3` articles (via `useRef` pour tracker la valeur précédente)
- Stocker un flag localStorage `wishlist_completion_celebrated_${userId}` pour ne montrer la célébration qu'une seule fois
- Quand la complétion est détectée :
  - Lancer `confetti` (même pattern que dans `WhatDoYouWantCard`)
  - Afficher un bandeau vert de félicitations (remplace le bandeau rouge) avec :
    - Icône `PartyPopper` + message : *"🎉 Bravo ! Votre liste de souhaits est prête ! Votre profil est maintenant complet pour rappeler à vos proches les événements qui marquent votre vie et les célébrer ensemble."*
    - Bouton "Compris !" pour fermer le bandeau
  - Gradient vert sur la carte temporairement

### Dépendances

- Importer `confetti` de `canvas-confetti` (déjà dans le projet)
- Importer `PartyPopper` de `lucide-react`
- Importer `useAuth` pour le userId (clé localStorage)
- Importer `useState, useEffect, useRef`

### Aucun autre fichier modifié

