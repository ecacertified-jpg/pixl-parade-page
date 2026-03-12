

# Plan : Afficher les infos prestataire dans la wishlist admin

## Objectif

Dans le modal `AdminWishlistModal`, afficher pour chaque article de la wishlist les informations du prestataire (nom de la boutique, téléphone, adresse, nom du propriétaire) afin que l'admin puisse le contacter avant de créer une cagnotte.

## Modifications

### `src/components/admin/AdminWishlistModal.tsx`

**1. Enrichir la requête Supabase** pour joindre les infos du prestataire via la relation `products → business_accounts` (FK `business_id`) :

```sql
products (
  id, name, description, price, currency, image_url,
  business_accounts!products_business_id_fkey (
    id, business_name, phone, address, user_id
  )
)
```

Puis, après avoir récupéré les `business_accounts.user_id` distincts, faire une requête sur `profiles` pour obtenir les noms des propriétaires.

**2. Ajouter une interface `VendorInfo`** au composant :
```ts
interface VendorInfo {
  businessName: string;
  phone: string | null;
  address: string | null;
  ownerName: string | null;
}
```

Stocker un `Map<string, VendorInfo>` (clé = product_id) dans le state.

**3. Enrichir le `WishlistItemRow`** : sous les badges existants, ajouter une section repliable ou une ligne compacte affichant :
- Nom de la boutique (icône Store)
- Téléphone cliquable (lien `tel:`) avec icône Phone
- Adresse avec icône MapPin
- Nom du propriétaire avec icône User

Le tout dans un petit bloc `bg-muted/30` sous l'article, avec des liens d'action directe (appel téléphonique).

### Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/admin/AdminWishlistModal.tsx` | Enrichir requête, state vendorInfo, affichage dans WishlistItemRow |

