

# Fix: Distance aberrante quand la géolocalisation retourne des coordonnées hors-pays

## Problème

La géolocalisation du navigateur retourne des coordonnées (donc "réussit"), mais ces coordonnées sont souvent celles du serveur/VPN/ISP (ex: Europe), pas celles de l'utilisateur réel en Côte d'Ivoire. Résultat : 5335 km pour un produit à Angré alors que l'utilisateur est à Abidjan.

## Solution

Valider les coordonnées retournées par le navigateur en les comparant aux `mapBounds` du pays de l'utilisateur. Si les coordonnées tombent hors des limites du pays, utiliser les coordonnées du centre économique du pays comme fallback.

### Fichier 1 : `src/utils/geoUtils.ts`

Ajouter une fonction `isLocationInCountryBounds(location, countryCode)` qui vérifie si les coordonnées sont dans les `mapBounds` du pays (avec une marge de tolérance de ~100 km).

### Fichier 2 : `src/pages/Shop.tsx`

Après `requestUserLocation()`, vérifier si la position retournée est dans les bounds du pays de l'utilisateur :
- **Si oui** : utiliser ces coordonnées (comportement actuel)
- **Si non** : utiliser les coordonnées du `mapCenter` du pays comme position approximative, et afficher un toast adapté ("Position approximative utilisée")

Cela garantit que les distances affichées sont cohérentes (ex: 2-15 km pour des produits dans la même ville) au lieu de 5335 km.

### Résumé des changements

| Fichier | Modification |
|---------|-------------|
| `src/utils/geoUtils.ts` | Ajouter `isLocationInCountryBounds()` |
| `src/pages/Shop.tsx` | Valider la géolocalisation contre les bounds du pays, fallback vers `mapCenter` |

