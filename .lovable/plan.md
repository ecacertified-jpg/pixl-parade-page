
# Correction de la Carte des Boutiques Vide

## Diagnostic

La page ExploreMap affiche correctement "13 boutiques" dans le header, ce qui confirme que:
1. La vue `business_public_info` fonctionne
2. Le hook `useExploreMapData` charge les données
3. Le fallback `findCityAcrossCountries` devrait fonctionner pour 11/12 boutiques sans GPS

**Probleme identifie** : Race condition dans `BusinessClusterMap.tsx`

La carte Mapbox et Supercluster ont des problemes de synchronisation :
- L'effet d'initialisation de la carte (ligne 196) depend de `[mapToken]` mais appelle `updateMarkers()` 
- L'effet Supercluster (ligne 44) depend de `[geoJsonPoints]`
- Si les donnees `geoJsonPoints` arrivent APRES le chargement de la carte, `updateMarkers()` ne trouve pas de clusters car Supercluster n'est pas encore initialise avec les donnees

## Solution Technique

### Modification 1 : Corriger les dependances React dans `BusinessClusterMap.tsx`

**Probleme** : `updateMarkers` est defini avec `useCallback` mais ses dependances ne sont pas correctement propagees aux effets qui l'utilisent.

**Correction** :
```tsx
// Effect d'initialisation de la carte - ajouter updateMarkers aux dependances
useEffect(() => {
  if (!mapContainerRef.current || !mapToken) return;
  // ... reste du code
}, [mapToken, updateMarkers]); // Ajouter updateMarkers

// OU mieux encore: utiliser un ref pour suivre si la carte est prete
const mapReadyRef = useRef(false);
```

### Modification 2 : S'assurer que Supercluster est pret avant de rendre les marqueurs

Ajouter une verification que les donnees sont chargees :
```tsx
const updateMarkers = useCallback(() => {
  if (!mapRef.current) return;
  
  // Verifier que supercluster a des donnees
  if (!superclusterRef.current || geoJsonPoints.length === 0) {
    clearMarkers(); // Nettoyer les anciens marqueurs
    return;
  }
  
  // ... reste du code
}, [clearMarkers, selectedBusiness, onBusinessSelect, geoJsonPoints.length]);
```

### Modification 3 : Forcer la mise a jour des marqueurs quand les donnees changent

Ajouter `geoJsonPoints` aux dependances de l'effet qui met a jour les marqueurs :
```tsx
useEffect(() => {
  if (mapRef.current && geoJsonPoints.length > 0) {
    // Recharger supercluster avec les nouvelles donnees
    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });
    superclusterRef.current.load(geoJsonPoints as any);
    updateMarkers();
  }
}, [geoJsonPoints, updateMarkers]);
```

## Fichier a Modifier

| Fichier | Type de modification |
|---------|---------------------|
| `src/components/BusinessClusterMap.tsx` | Corriger les effets React et le timing de l'initialisation |

## Flux Corrige

```text
1. Composant monte
2. useMapboxToken retourne le token
3. Carte Mapbox s'initialise (event 'load')
4. useExploreMapData charge les boutiques via API
5. geoJsonPoints mis a jour -> useEffect detecte le changement
6. Supercluster reinitialise avec les nouvelles donnees
7. updateMarkers() appele -> marqueurs affiches
```

## Avantages de la Correction

1. **Fiabilite** : Les marqueurs s'affichent toujours, peu importe l'ordre de chargement
2. **Reactivite** : Mise a jour automatique quand les filtres changent
3. **Performance** : Pas de recreation inutile de la carte
