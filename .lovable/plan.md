

# Plan : Harmoniser les onglets + ajouter la wishlist dans l'onglet Anniversaires

## 1. Harmoniser les onglets dans MyAssignments

Le `TabsList` actuel utilise le style par défaut (fond gris muted). Pour un rendu plus harmonieux et conforme au screenshot (onglets arrondis, bien espacés, visibles sur mobile) :

- Ajouter des classes au `TabsList` : `w-full grid grid-cols-3` pour répartir uniformément les 3 onglets
- Arrondir avec `rounded-xl` et ajouter un peu de padding
- S'assurer que les onglets s'affichent correctement en responsive (texte tronqué sur petit écran si nécessaire)

## 2. Ajouter un bouton "Voir les souhaits" dans la colonne Relation de l'onglet Anniversaires

Dans `AdminBirthdaysContent.tsx`, modifier la colonne "Relation" du tableau pour ajouter un bouton/icône cliquable (Heart) qui ouvre le `AdminWishlistModal` :

- Importer `AdminWishlistModal` et ajouter les states `wishlistUserId`, `wishlistUserName`, `wishlistModalOpen`
- Pour les entrées de type `contact` : utiliser le `ownerId` pour ouvrir la wishlist de l'utilisateur propriétaire
- Pour les entrées de type `user` : utiliser le `id` directement
- Afficher un petit bouton Heart à côté du badge de relation
- Rendre le `AdminWishlistModal` en bas du composant

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/pages/Admin/MyAssignments.tsx` | Harmoniser le style du TabsList (grid cols-3, rounded-xl) |
| `src/components/admin/AdminBirthdaysContent.tsx` | Ajouter bouton wishlist dans colonne Relation + AdminWishlistModal |

