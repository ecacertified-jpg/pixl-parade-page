

## Probleme

Quand vous selectionnez une ville (ex: "Abidjan") dans le selecteur de lieu sur la page Boutique, aucun produit ne s'affiche. Cela vient d'une erreur de filtrage :

- Le selecteur de ville renvoie un nom de ville comme "Abidjan"
- Le filtre compare cette valeur au champ `location_name` du produit, qui est un champ reserve aux experiences (ex: "Spa Royal", "Atelier Poterie") et qui vaut "Non specifie" pour la plupart des produits
- Ces deux valeurs ne correspondent jamais, donc tous les produits sont filtres

## Solution

Modifier `src/pages/Shop.tsx` pour filtrer par l'adresse de la boutique au lieu du champ `location_name` du produit :

### 1. Recuperer l'adresse de la boutique

Dans la requete qui charge les infos business (ligne ~236), ajouter le champ `address` :

```typescript
.select('id, business_name, logo_url, latitude, longitude, country_code, address')
```

### 2. Stocker l'adresse dans le mapping produit

Ajouter un champ `businessAddress` dans le type produit et dans le mapping (ligne ~331) :

```typescript
businessAddress: businessInfo?.address || "",
```

### 3. Corriger le filtre de localisation

Remplacer la ligne 469 :

```typescript
// AVANT (ne marche pas - compare ville a un champ experience)
const matchesLocation = !selectedLocation || selectedLocation === "Tous les lieux" 
  || product.locationName === selectedLocation;

// APRES (compare ville a l'adresse de la boutique, insensible a la casse)
const matchesLocation = !selectedLocation || selectedLocation === "Tous les lieux" 
  || (product.businessAddress && product.businessAddress.toLowerCase().includes(selectedLocation.toLowerCase()));
```

Cette approche fonctionne car les adresses contiennent toujours le nom de la ville (ex: "Siporex, Yopougon, Abidjan", "Kowegbo, Akpakpa, Cotonou"). La recherche par `includes` permet de matcher les communes aussi (chercher "Yopougon" trouvera "Siporex, Yopougon, Abidjan").

### Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/pages/Shop.tsx` | Ajouter `address` a la requete business, ajouter `businessAddress` au mapping produit, corriger le filtre |

