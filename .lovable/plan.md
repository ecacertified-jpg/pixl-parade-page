

# Plan : Créer des cagnottes depuis les affectations admin via la wishlist

## Objectif

Permettre aux admins, depuis la page "Mes affectations", de :
1. Voir la liste de souhaits (wishlist) d'un utilisateur assigné
2. Voir la wishlist des **contacts** de cet utilisateur
3. Créer une cagnotte collective directement à partir d'un article de la wishlist

## Architecture

Le flux est le suivant :
- L'admin clique sur un nouvel item "Voir les souhaits" dans le menu d'actions d'un utilisateur assigné
- Un modal s'ouvre listant la wishlist de l'utilisateur ET les wishlists de ses contacts
- Sur chaque article, un bouton "Créer une cagnotte" ouvre le `CreateSurpriseFundModal` existant, pré-rempli avec le produit sélectionné

## Modifications

### 1. Nouveau composant `src/components/admin/AdminWishlistModal.tsx`

Modal qui :
- Reçoit un `userId` (l'utilisateur assigné)
- Charge ses `user_favorites` avec les produits associés (wishlist personnelle)
- Charge ses `contacts` puis pour chaque contact avec `linked_user_id`, charge les `user_favorites` du contact
- Affiche deux sections : "Souhaits de [Prénom]" et "Souhaits des contacts de [Prénom]"
- Chaque article affiche : image, nom produit, prix, priorité, occasion, bouton "Créer une cagnotte"
- Le bouton ouvre le `CreateSurpriseFundModal` avec le `beneficiaryContactId`, `beneficiaryName`, et le produit pré-sélectionné

### 2. Modification de `src/pages/Admin/MyAssignments.tsx`

- Ajouter un state pour le modal wishlist (`wishlistUserId`, `wishlistModalOpen`)
- Ajouter un item "Voir les souhaits" (icône Heart) dans le `DropdownMenuContent` de chaque utilisateur (ligne 326-344)
- Importer et rendre le nouveau `AdminWishlistModal`

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/admin/AdminWishlistModal.tsx` | Nouveau — modal wishlist utilisateur + contacts |
| `src/pages/Admin/MyAssignments.tsx` | Ajout menu "Voir les souhaits" + state modal |

### Détails techniques

- La wishlist personnelle est chargée via `user_favorites` filtré par `user_id` = l'utilisateur assigné
- Les contacts sont chargés via `contacts` filtré par `user_id` = l'utilisateur assigné, puis pour chaque `linked_user_id` non null, on charge les `user_favorites`
- Les requêtes utilisent le client Supabase standard (les admins ont accès SELECT via les RLS policies existantes sur `contacts` et `user_favorites`)
- Le `CreateSurpriseFundModal` est réutilisé tel quel, l'admin créant la cagnotte en son nom (creator_id = admin user id)

