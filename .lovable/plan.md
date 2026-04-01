

# Plan : Modal wishlist avec creation directe de cagnotte pour soi-meme

## Resume

Quand l'utilisateur clique "Creer ma cagnotte" dans le `SearchExistingFundsModal`, afficher un nouveau modal listant ses articles de wishlist. Chaque article a un bouton "Creer" qui ajoute automatiquement l'article au panier en mode cagnotte collaborative pour soi-meme (beneficiaire = l'utilisateur), puis redirige vers le checkout.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/WishlistFundPickerModal.tsx` | **Nouveau** — Modal affichant les articles de la wishlist avec bouton "Creer" par article |
| `src/components/SearchExistingFundsModal.tsx` | Ouvrir le nouveau modal au lieu de naviguer vers `/favorites` |

## Detail technique

### 1. Nouveau composant `WishlistFundPickerModal.tsx`

- Utilise `useFavorites()` pour charger les articles de la wishlist
- Affiche chaque article : image, nom, prix, bouton "Creer"
- Au clic sur "Creer" :
  - Recupere le prenom/nom de l'utilisateur via `useAuth()` (user_metadata)
  - Appelle `addItem()` du `useCart()` avec `isCollaborativeGift: true`, `isSelfFund: true`, `beneficiaryName: "Prenom Nom"`
  - Redirige vers `/cart` pour finaliser la commande (qui declenche ensuite le `ShareBirthdayToCirclesModal`)
- Etats : loading, liste vide (CTA vers `/favorites` pour ajouter des articles), liste d'articles

### 2. Modification de `SearchExistingFundsModal.tsx`

- Ajouter un state `showWishlistPicker`
- Au clic "Creer ma cagnotte" : `setShowWishlistPicker(true)` au lieu de `navigate('/favorites')`
- Rendre `<WishlistFundPickerModal>` dans le JSX
- Quand le wishlist modal se ferme, revenir au SearchExistingFundsModal

### Flux utilisateur

```text
SearchExistingFundsModal
  → clic "Creer ma cagnotte"
  → WishlistFundPickerModal (liste des articles wishlist)
    → clic "Creer" sur un article
    → article ajoute au panier (mode self-fund)
    → redirection /cart
    → checkout → CollectiveOrderConfirmation
      → ShareBirthdayToCirclesModal (partage aux cercles)
```

