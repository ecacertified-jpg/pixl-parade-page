
# Corriger le Chargement des Tuiles de Carte dans LocationPicker

## Diagnostic

D'après la capture d'écran, on observe :
- **Le marqueur violet est visible** (c'est un élément HTML/SVG créé localement)
- **Les tuiles de carte sont vides** (fond beige sans rues ni bâtiments)
- **Les coordonnées GPS sont correctes** (6.365400° N, 2.418300° E)
- **L'utilisateur est au Bénin** (détecté dans les logs)

### Causes Probables

| Cause | Probabilité | Explication |
|-------|-------------|-------------|
| Token Mapbox restreint par URL | Élevée | Le token est configuré pour `*.lovable.app` mais peut ne pas couvrir toutes les variantes de preview |
| Problème de dépendances useEffect | Moyenne | Le hook qui initialise la carte inclut `getInitialCoordinates` qui change à chaque rendu |
| Erreur réseau/CORS silencieuse | Possible | Mapbox peut échouer silencieusement sans log console |
| Cache navigateur corrompu | Faible | Le style de carte peut être mis en cache avec une erreur |

## Solution Proposée

### Modification 1 : Ajouter la gestion des erreurs Mapbox

Ajouter un listener pour l'événement `error` de Mapbox pour diagnostiquer les problèmes de token :

```typescript
map.current.on("error", (e) => {
  console.error("Mapbox error:", e.error);
  // Si erreur d'authentification, afficher un message
  if (e.error?.status === 401 || e.error?.status === 403) {
    setGeoError("Erreur d'authentification carte - token invalide ou domaine non autorisé");
  }
});
```

### Modification 2 : Stabiliser les dépendances du useEffect

Le `getInitialCoordinates` est recréé à chaque rendu car ses dépendances changent. Il faut le stabiliser :

**Avant (problématique)** :
```typescript
useEffect(() => {
  // ...
}, [mapboxToken, getInitialCoordinates, createMarker, updateMarkerPosition, disabled]);
```

**Après (stable)** :
```typescript
// Utiliser useRef pour les coordonnées initiales
const initialCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

// Calculer une seule fois au premier rendu
useEffect(() => {
  if (!initialCoordsRef.current) {
    initialCoordsRef.current = getInitialCoordinates();
  }
}, [getInitialCoordinates]);

// useEffect d'initialisation avec dépendances minimales
useEffect(() => {
  if (!mapboxToken || !mapContainer.current || map.current) return;
  
  const coords = initialCoordsRef.current || { lat: 5.3364, lng: -4.0267 };
  // ... reste du code
}, [mapboxToken]); // Dépendance réduite
```

### Modification 3 : Forcer le rechargement du style si vide

Ajouter une vérification après le chargement pour recharger le style si les sources sont vides :

```typescript
map.current.on("load", () => {
  setMapLoaded(true);
  
  // Vérifier si le style est correctement chargé
  const style = map.current?.getStyle();
  if (!style?.sources || Object.keys(style.sources).length === 0) {
    console.warn("Map style has no sources, attempting reload...");
    map.current?.setStyle("mapbox://styles/mapbox/streets-v12");
  }
  
  if (coords) {
    createMarker(coords);
  }
});
```

### Modification 4 : Ajouter un indicateur de chargement

Afficher un loader pendant que les tuiles se chargent :

```typescript
const [tilesLoading, setTilesLoading] = useState(true);

// Dans le useEffect
map.current.on("idle", () => {
  setTilesLoading(false);
});

// Dans le JSX
{tilesLoading && mapLoaded && (
  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)}
```

## Fichier à Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/LocationPicker.tsx` | 1. Ajouter listener `error` pour Mapbox |
| | 2. Stabiliser les dépendances useEffect avec useRef |
| | 3. Ajouter vérification/reload du style |
| | 4. Ajouter indicateur de chargement des tuiles |

## Test de Validation du Token

Pour vérifier si le token fonctionne, on peut aussi ajouter un test au démarrage :

```typescript
// Tester le token avant d'initialiser la carte
const testMapboxToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`
    );
    return response.ok;
  } catch {
    return false;
  }
};
```

## Architecture de la Solution

```text
┌─────────────────────────────────────────────────────────────┐
│                    LocationPicker                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Initialisation                                   │   │
│  │     - useRef pour coordonnées initiales (stable)     │   │
│  │     - Une seule création de carte                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. Listeners Mapbox                                 │   │
│  │     - on("load") → créer marqueur                    │   │
│  │     - on("error") → afficher erreur token           │   │
│  │     - on("idle") → masquer loader                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3. Affichage                                        │   │
│  │     - Loader pendant chargement tuiles              │   │
│  │     - Message d'erreur si token invalide            │   │
│  │     - Carte fonctionnelle sinon                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Résultat Attendu

Après ces modifications :
- La carte affichera les tuiles correctement si le token est valide
- Un message d'erreur explicite apparaîtra si le token est rejeté
- Les re-rendus inutiles de la carte seront évités
- Un loader indiquera que les tuiles sont en cours de chargement
