

## Optimisation du chargement de la page Boutique

### Problemes identifies

La page Shop.tsx effectue **6 requetes sequentielles** au chargement, et `loadProducts()` est appelee **2 fois** (au montage + quand la geolocalisation arrive) :

1. `loadProducts()` : charge TOUS les produits actifs (pas de limite)
2. Puis TOUS les business_accounts associes
3. Puis TOUS les product_ratings
4. `loadPopularShops()` : charge les boutiques populaires
5. Puis leurs produits
6. Puis leurs ratings

De plus, un abonnement temps reel recharge TOUS les produits a chaque modification dans la table.

### Corrections proposees

#### 1. Paralleliser les requetes dans `loadProducts()`

Au lieu de 3 requetes sequentielles (produits -> businesses -> ratings), lancer les requetes businesses et ratings en parallele avec `Promise.all()` apres avoir obtenu les produits.

#### 2. Eviter le double chargement au montage

Le `useEffect` sur `userLocation` declenche un rechargement complet. Fusionner la logique pour que `loadProducts()` ne soit appelee qu'une seule fois au montage, et que le changement de geolocalisation ne fasse que re-trier les produits localement (sans requete).

#### 3. Ajouter un etat de chargement visible

Afficher un skeleton pendant le chargement initial pour donner un retour visuel immediat.

#### 4. Limiter le nombre de produits charges

Ajouter `.limit(200)` a la requete produits pour eviter de charger des milliers de produits.

#### 5. Supprimer le rechargement complet en temps reel

Remplacer le `loadProducts()` dans le listener temps reel par une mise a jour locale incrementale (ajouter/modifier/supprimer le produit concerne uniquement).

### Fichier a modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/Shop.tsx` | Paralleliser les requetes, eviter le double chargement, ajouter un loading state, limiter les produits, optimiser le temps reel |

### Detail technique

```text
AVANT :
  mount -> loadProducts() [3 requetes sequentielles]
        -> loadPopularShops() [3 requetes sequentielles]
  geolocation -> loadProducts() [3 requetes de nouveau]
  temps reel -> loadProducts() [3 requetes a chaque changement]
  Total au demarrage : ~9 requetes sequentielles

APRES :
  mount -> loadProducts() [1 requete + 2 en parallele]
        -> loadPopularShops() [1 requete + 2 en parallele]
  geolocation -> re-tri local uniquement (0 requete)
  temps reel -> mise a jour locale du produit concerne (0 requete)
  Total au demarrage : ~4 requetes (2 en parallele)
```

