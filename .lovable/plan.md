

# Plan : Animation d'urgence sur la carte wishlist

## Contexte

Quand l'utilisateur a ajouté ≥2 amis mais a <3 articles dans sa liste de souhaits, la carte "Ma liste de souhaits" (`FavoriteArticlesSection`) doit afficher une animation d'urgence pulsante avec un message expliquant qu'il faut ajouter au moins 3 produits pour arrêter l'alerte.

## Changement

### Fichier : `src/components/FavoriteArticlesSection.tsx`

- Importer `useDashboardData` pour accéder au nombre d'amis (`friends.length`)
- Calculer `showUrgency = friends.length >= 2 && stats.total < 3`
- Quand `showUrgency` est vrai :
  - Ajouter une bordure rouge pulsante (animation CSS `animate-pulse` + `border-red-500`) sur la Card
  - Ajouter un bandeau d'alerte rouge en haut de la carte avec icône `AlertTriangle` et message : *"⚠️ Alerte : Ajoutez au moins 3 produits à votre liste pour désactiver cette alerte !"*
  - Le bouton "Parcourir" reçoit un style rouge avec animation `animate-bounce` pour attirer l'attention
- Quand `stats.total >= 3` ou `friends.length < 2` : carte normale, pas d'animation

### Aucun autre fichier modifié

Le hook `useFavorites` fournit déjà `stats.total` et `useDashboardData` fournit `friends`. Tout se passe dans le composant existant.

