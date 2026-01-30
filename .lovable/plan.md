

# Afficher les Produits les Plus Proches avec Drapeau du Pays d'Origine

## Objectif

Améliorer la page Boutique pour :
1. **Afficher les produits triés par proximité** de la position de l'utilisateur
2. **Marquer chaque carte produit avec le drapeau** de son pays d'origine

## Architecture Proposée

```text
+-------------------+     +----------------------+     +------------------+
|   Shop.tsx        |     |  useNearbyProducts   |     |   Supabase       |
|   (Page)          |---->|  (Nouveau Hook)      |---->|   Database       |
+-------------------+     +----------------------+     +------------------+
        |                           |
        v                           v
+-------------------+     +----------------------+
|  Carte Produit    |     |  Géolocalisation     |
|  + CountryBadge   |     |  navigator.geolocation|
+-------------------+     +----------------------+
```

## Modifications

### 1. Nouveau Hook : `useNearbyProducts.ts`

Créer un hook dédié pour récupérer les produits avec :
- Les coordonnées de la boutique associée (via `business_accounts`)
- Le `country_code` du produit ou de la boutique
- Le calcul de distance par rapport à l'utilisateur
- Le tri par proximité

| Fonctionnalité | Description |
|----------------|-------------|
| Géolocalisation | Utilise `navigator.geolocation` pour obtenir la position |
| Distance | Formule Haversine (réutilisation de la fonction existante) |
| Fallback | Si pas de géolocalisation, affiche sans tri par distance |
| Country code | Priorité : product.country_code > business.country_code |

### 2. Modifier la Page `Shop.tsx`

| Modification | Détails |
|--------------|---------|
| Importer CountryBadge | `import { CountryBadge } from "@/components/CountryBadge"` |
| Ajouter géolocalisation | État `userLocation` + demande de permission |
| Enrichir loadProducts | Récupérer latitude/longitude et country_code via join |
| Trier par proximité | Après le fetch, trier par distance calculée |
| Afficher distance réelle | Remplacer "2.3 km" par la vraie distance |
| Afficher le drapeau | Ajouter `CountryBadge` sur chaque carte |

### 3. Interface Produit Enrichie

Ajouter les champs au type de produit dans Shop.tsx :

```typescript
interface Product {
  // ... champs existants ...
  countryCode: string | null;        // Nouveau
  businessLatitude: number | null;   // Nouveau
  businessLongitude: number | null;  // Nouveau
  distanceKm: number | null;         // Nouveau (calculé)
}
```

## Détails Techniques

### Requête Supabase Modifiée

```sql
SELECT 
  products.*,
  business_accounts.latitude,
  business_accounts.longitude,
  COALESCE(products.country_code, business_accounts.country_code) as effective_country_code
FROM products
LEFT JOIN business_accounts ON products.business_account_id = business_accounts.id
WHERE products.is_active = true
```

### Calcul de Distance (Haversine)

La fonction existe déjà dans `useExploreMapData.ts`. Elle sera extraite dans un utilitaire partagé :

```typescript
// src/utils/geoUtils.ts
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  // ... calcul existant ...
}
```

### Position de l'Utilisateur

Ajouter un bouton optionnel "Me localiser" ou demander automatiquement :

```typescript
const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

const requestLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => console.warn('Géolocalisation refusée')
  );
};
```

### Affichage du Drapeau sur la Carte

```tsx
{/* Dans la carte produit, après l'image */}
<div className="absolute top-2 left-2 flex items-center gap-2">
  <CountryBadge countryCode={product.countryCode} variant="compact" />
  {product.isExperience && (
    <Badge className="bg-purple-600">✨ EXPÉRIENCE</Badge>
  )}
</div>
```

### Affichage de la Distance

```tsx
{/* Remplacer la distance fixe "2.3 km" */}
<span className="text-xs text-muted-foreground">
  {product.distanceKm !== null 
    ? `${product.distanceKm.toFixed(1)} km`
    : "Distance inconnue"
  }
</span>
```

## Fichiers à Modifier/Créer

| Fichier | Action |
|---------|--------|
| `src/utils/geoUtils.ts` | Créer - Extraire la fonction Haversine |
| `src/pages/Shop.tsx` | Modifier - Ajouter géolocalisation, country_code, tri par distance |
| `src/hooks/useExploreMapData.ts` | Modifier - Utiliser l'utilitaire partagé |

## Comportement Attendu

| Scénario | Résultat |
|----------|----------|
| Géolocalisation acceptée | Produits triés du plus proche au plus éloigné, distance affichée |
| Géolocalisation refusée | Produits affichés sans tri par distance, drapeau toujours visible |
| Produit sans coordonnées | Affiché en fin de liste avec "Distance inconnue" |
| Produit sans country_code | CountryBadge n'affiche rien (comportement existant) |

## UX Mobile

- Bouton de géolocalisation discret dans l'en-tête
- Indicateur de chargement pendant la récupération de position
- Toast de confirmation "Position détectée"
- Les drapeaux s'affichent en overlay sur l'image produit (coin supérieur gauche)

