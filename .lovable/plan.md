

# Ajouter un Indicateur Visuel de Précision GPS

## Objectif

Afficher un cercle semi-transparent autour du marqueur GPS pour indiquer la marge d'erreur de la géolocalisation. Plus le cercle est petit, plus la position est précise.

## Comportement

| Situation | Comportement |
|-----------|-------------|
| Clic sur "Ma position GPS" | Affiche le marqueur + cercle de précision |
| Clic sur la carte | Affiche uniquement le marqueur (pas de cercle) |
| Sélection d'une ville | Affiche uniquement le marqueur (pas de cercle) |
| Déplacement du marqueur | Le cercle disparaît (position manuelle) |

## Détails Techniques

### Source de Données
L'API Geolocation fournit `position.coords.accuracy` qui représente la précision en **mètres**. Cette valeur varie généralement de :
- **5-10m** : GPS haute précision (outdoor, bon signal)
- **20-50m** : Précision moyenne (indoor, signal partiel)
- **100m+** : Faible précision (WiFi/cellulaire uniquement)

### Implémentation Mapbox

Utiliser une **source GeoJSON** avec un **layer de type circle** pour dessiner le cercle de précision :

```text
┌────────────────────────────────────────┐
│                 Carte                  │
│                                        │
│          ┌─────────────┐              │
│         /   Cercle de   \             │
│        │    précision    │            │
│        │      GPS        │            │
│        │   ┌───────┐     │            │
│        │   │Marqueur│    │            │
│        │   └───────┘     │            │
│         \               /             │
│          └─────────────┘              │
│                                        │
└────────────────────────────────────────┘
```

## Modifications

### 1. Nouveau State pour la Précision

Ajouter un state pour stocker la précision GPS actuelle :

```typescript
const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
```

### 2. Fonction pour Dessiner le Cercle de Précision

Créer une fonction qui utilise les layers Mapbox pour afficher un cercle :

```typescript
const updateAccuracyCircle = useCallback((lat: number, lng: number, accuracy: number) => {
  // Créer un cercle GeoJSON centré sur la position
  // Rayon = accuracy en mètres converti en pixels selon le zoom
});
```

### 3. Modifier handleUseCurrentPosition

Capturer `position.coords.accuracy` et appeler la fonction de dessin :

```typescript
navigator.geolocation.getCurrentPosition((position) => {
  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  setGpsAccuracy(accuracy);
  // ... code existant ...
  updateAccuracyCircle(lat, lng, accuracy);
});
```

### 4. Effacer le Cercle lors d'Actions Manuelles

Supprimer le cercle quand l'utilisateur clique sur la carte ou déplace le marqueur.

### 5. Affichage de la Précision dans l'UI

Afficher la précision en mètres à côté des coordonnées :

```text
5.3364° N, -4.0267° W  [Position GPS]  [± 15m]
```

## Fichier à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/LocationPicker.tsx` | Ajouter state, fonction cercle, mise à jour géoloc, affichage précision |

## Style du Cercle

| Propriété | Valeur |
|-----------|--------|
| Couleur de remplissage | `hsl(259, 58%, 59%)` avec 15% opacité |
| Bordure | `hsl(259, 58%, 59%)` avec 50% opacité, 2px |
| Animation | Pulse léger (optionnel) |

## Résultat Attendu

- Lors de l'utilisation du GPS, un cercle bleu/violet semi-transparent entoure le marqueur
- Le rayon du cercle correspond à la précision GPS réelle en mètres
- La précision s'affiche en texte (ex: "± 15m")
- Le cercle disparaît lors d'un positionnement manuel
- L'utilisateur comprend visuellement la fiabilité de sa position GPS

