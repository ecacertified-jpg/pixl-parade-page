
# Corriger le Bug du Marqueur Persistant dans LocationPicker

## Diagnostic

### Problème Observé
Lorsqu'une nouvelle ville est sélectionnée (ex: "Anyama Grand Séminaire"), l'ancien marqueur reste visible sur la carte à l'emplacement précédent, bien que les coordonnées affichées soient correctes.

### Cause Racine

Le problème se situe dans la gestion des références du marqueur. En analysant le code :

1. **Double appel dans le click handler** (lignes 286-291) :
```typescript
map.current.on("click", (e) => {
  updateMarkerPosition(lat, lng);  // Met à jour le ref
  createMarker({ lat, lng });      // Crée un nouveau marqueur
});
```
Le `createMarker` est appelé immédiatement après `updateMarkerPosition`, mais `updateMarkerPosition` utilise `marker.current.setLngLat()` qui modifie le marqueur existant, puis `createMarker` en crée un nouveau sans que la référence soit correctement mise à jour.

2. **Problème de synchronisation** : L'effet qui surveille les changements de coordonnées (lignes 312-321) appelle aussi `createMarker`, ce qui peut créer des marqueurs multiples si les appels s'enchaînent rapidement.

3. **Suppression du marqueur incomplète** : La fonction `createMarker` supprime le marqueur via `marker.current.remove()`, mais la référence n'est pas toujours correctement mise à `null`, laissant potentiellement des marqueurs orphelins.

## Solution

### Modification 1 : Nettoyer proprement la référence du marqueur

Dans `createMarker`, s'assurer que la référence est mise à `null` après suppression :

```typescript
const createMarker = useCallback((coords: { lat: number; lng: number }) => {
  if (!map.current) return;

  // Remove existing marker and clear reference
  if (marker.current) {
    marker.current.remove();
    marker.current = null;  // <-- AJOUTER CETTE LIGNE
  }
  // ... reste du code
}, [disabled, onCoordinatesChange]);
```

### Modification 2 : Ne pas doubler l'appel dans le click handler

Supprimer l'appel à `createMarker` dans le gestionnaire de clic, car `updateMarkerPosition` + l'effet de synchronisation s'en chargent déjà :

```typescript
// Avant (bugué)
map.current.on("click", (e) => {
  if (disabled) return;
  const { lat, lng } = e.lngLat;
  updateMarkerPosition(lat, lng);
  createMarker({ lat, lng }); // <-- SUPPRIMER
});

// Après (corrigé)
map.current.on("click", (e) => {
  if (disabled) return;
  const { lat, lng } = e.lngLat;
  createMarker({ lat, lng });
  clearAccuracyCircle();
  onCoordinatesChange(lat, lng);
});
```

### Modification 3 : Simplifier updateMarkerPosition

Modifier `updateMarkerPosition` pour ne pas repositionner le marqueur existant (ce qui crée une confusion) mais seulement mettre à jour les coordonnées :

```typescript
const updateMarkerPosition = useCallback((lat: number, lng: number) => {
  clearAccuracyCircle();
  onCoordinatesChange(lat, lng);
}, [onCoordinatesChange, clearAccuracyCircle]);
```

Le marqueur sera recréé par l'effet de synchronisation qui surveille `latitude` et `longitude`.

### Modification 4 : Éviter les recréations multiples dans l'effet de synchronisation

Ajouter une vérification pour ne pas recréer le marqueur s'il est déjà à la bonne position :

```typescript
useEffect(() => {
  if (map.current && mapLoaded && latitude !== null && longitude !== null) {
    const currentLngLat = marker.current?.getLngLat();
    
    // Éviter de recréer si déjà à la bonne position
    if (currentLngLat && 
        Math.abs(currentLngLat.lat - latitude) < 0.0001 && 
        Math.abs(currentLngLat.lng - longitude) < 0.0001) {
      return;
    }
    
    createMarker({ lat: latitude, lng: longitude });
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 1000,
    });
  }
}, [latitude, longitude, mapLoaded, createMarker]);
```

## Fichier à Modifier

| Fichier | Ligne | Modification |
|---------|-------|-------------|
| `src/components/LocationPicker.tsx` | 85-87 | Ajouter `marker.current = null` après remove |
| `src/components/LocationPicker.tsx` | 286-291 | Simplifier le click handler |
| `src/components/LocationPicker.tsx` | 212-218 | Simplifier updateMarkerPosition |
| `src/components/LocationPicker.tsx` | 312-321 | Éviter recréations inutiles |

## Résultat Attendu

- Lors de la sélection d'une nouvelle ville, l'ancien marqueur disparaît complètement
- Un seul marqueur est visible à la fois sur la carte
- Les coordonnées et la position du marqueur sont toujours synchronisées
- Pas de marqueurs "fantômes" ou orphelins
