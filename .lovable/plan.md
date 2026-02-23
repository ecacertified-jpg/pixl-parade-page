
# Ajout d'un acces rapide vers le catalogue de souhaits depuis le Dashboard

## Ce qui sera fait

Ajouter la section `FavoriteArticlesSection` (deja existante) dans le Dashboard, juste apres la section des rappels d'anniversaire et avant les cartes de badges. Cette section affiche le nombre d'articles dans la liste de souhaits et un bouton "Voir tout" qui mene vers `/favorites`.

En complement, un bouton "Parcourir le catalogue" sera ajoute dans cette section pour diriger l'utilisateur vers `/wishlist-catalog`, lui permettant de decouvrir et ajouter de nouveaux articles a sa wishlist directement depuis le Dashboard.

## Modifications

### 1. `src/pages/Dashboard.tsx`
- Importer `FavoriteArticlesSection`
- Inserer le composant entre la section "Rappels d'anniversaires intelligents" (ligne ~583) et les cartes de badges (ligne ~586)

### 2. `src/components/FavoriteArticlesSection.tsx`
- Ajouter un second bouton "Parcourir le catalogue" qui navigue vers `/wishlist-catalog`
- Ce bouton sera place a cote du bouton "Voir tout" existant, avec une icone de recherche/catalogue

## Resultat attendu
L'utilisateur verra sur son Dashboard :
- Le nombre d'articles dans sa liste de souhaits
- Un bouton "Voir tout" (vers `/favorites` pour gerer les parametres)
- Un bouton "Parcourir" (vers `/wishlist-catalog` pour ajouter de nouveaux articles)
