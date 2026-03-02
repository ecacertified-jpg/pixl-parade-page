

# Rediriger "Offrir" et l'icone cadeau vers la boutique du vendeur

## Probleme

1. Le bouton **"Offrir"** dans la wishlist d'un contact ajoute le produit au panier au lieu de rediriger vers la boutique du vendeur avec les options Commander/Reserver/Cotisation.
2. Le bouton **icone cadeau** dans "Mon cercle d'amis" redirige vers `/shop?giftFor=...` (boutique generale) au lieu de montrer les souhaits du contact avec acces direct aux boutiques des vendeurs.

## Solution

### 1. `src/hooks/useContactWishlist.ts` -- Ajouter les infos vendeur

Modifier la requete Supabase pour inclure `business_account_id` dans le select des `products` :

```text
products (id, name, description, price, currency, image_url, business_account_id)
```

Ajouter `business_account_id: string | null` a l'interface `ContactWishlistItem.product`.

### 2. `src/components/ContactWishlistSection.tsx` -- Naviguer vers la boutique

- Importer `useNavigate` de react-router-dom
- Remplacer le comportement du bouton "Offrir" : au lieu d'appeler `onSelect(item)`, naviguer vers `/boutique/{business_account_id}?product={product_id}` 
- Si `business_account_id` est null (produit sans boutique), conserver le comportement actuel (`onSelect`)
- Le VendorShop intercepte deja le query param `?product=` pour ouvrir l'OrderModal automatiquement (deep linking existant)

### 3. `src/pages/Dashboard.tsx` -- Changer la destination du bouton cadeau

Actuellement (ligne 951) :
```text
onClick={() => navigate(`/shop?giftFor=${friend.id}&friendName=${encodeURIComponent(friend.name)}`)}
```

Changer pour naviguer vers la page "Idees cadeaux" du contact, qui affiche deja la wishlist :
```text
onClick={() => navigate(`/gift-ideas/${friend.id}`)}
```

Cela montre les souhaits du contact avec le bouton "Offrir" qui redirige maintenant vers la boutique du vendeur.

### 4. `src/pages/GiftIdeas.tsx` -- Adapter le handler

Remplacer le `onSelectProduct` qui ajoute au panier par une navigation vers la boutique du vendeur, coherent avec le changement dans `ContactWishlistSection`.

## Flux apres modification

```text
Dashboard "Mon cercle d'amis"
  |-- Clic icone cadeau --> /gift-ideas/{contactId}
       |-- Liste de souhaits avec boutons "Offrir"
            |-- Clic "Offrir" --> /boutique/{businessId}?product={productId}
                 |-- OrderModal s'ouvre automatiquement
                      |-- Options : A moi-meme / Offrir / Cotisation groupee
```

## Fichiers modifies

- `src/hooks/useContactWishlist.ts` (ajouter business_account_id au select)
- `src/components/ContactWishlistSection.tsx` (navigation vers boutique vendeur)
- `src/pages/Dashboard.tsx` (changer destination du bouton cadeau)
- `src/pages/GiftIdeas.tsx` (adapter le handler onSelectProduct)
