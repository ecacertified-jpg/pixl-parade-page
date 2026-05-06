## Problème

Dans la modale "Ma liste de souhaits" (`WishlistFundPickerModal`), seuls les favoris internes (table `user_favorites` → `products`) sont affichés. Les articles ajoutés depuis Jumia (table `external_favorites` via `JumiaImportModal`) n'apparaissent pas, alors qu'ils sont bien enregistrés comme favoris de l'utilisateur.

## Solution

Fusionner les favoris externes (`useExternalFavorites`) avec les favoris internes dans la modale, et rediriger leur bouton "Créer" vers `ExternalProductFundModal` (avec `preset`) au lieu du panier.

## Changements

### `src/components/WishlistFundPickerModal.tsx`
- Importer `useExternalFavorites` et `ExternalProductFundModal`.
- Charger les favoris externes uniquement pour le cas "moi-même" (pas pour un bénéficiaire externe — sa liste externe n'est pas accessible).
- Construire une liste unifiée combinant :
  - favoris internes (rendu actuel + bouton "Créer" → flux panier existant)
  - favoris externes, avec :
    - badge orange "Jumia" (ou nom de plateforme)
    - prix estimé affiché normalement
    - bouton "Créer" qui ouvre `ExternalProductFundModal` avec `preset` pré-rempli (`productUrl`, `productName`, `productImageUrl`, `estimatedPrice`, `platform`)
- Mettre à jour `itemCount` pour inclure les deux sources.
- Ajuster l'état vide pour proposer aussi "Ajouter depuis Jumia" via le catalogue (`/wishlist-catalog`).

### Comportement
- Self-fund interne → flux inchangé (cart).
- Self-fund externe (Jumia) → ouverture de `ExternalProductFundModal` pré-rempli ; à 100 % la cagnotte suit le flux `awaiting_beneficiary_purchase` + Wave déjà en place.
- Bénéficiaire externe (ami) → on n'affiche pas ses favoris externes (privé / non lisible côté donateur) ; logique actuelle préservée.

## Fichiers modifiés
- `src/components/WishlistFundPickerModal.tsx`
