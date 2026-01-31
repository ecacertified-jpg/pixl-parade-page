

# Corriger le Message d'Erreur Persistant dans LocationPicker

## Diagnostic

### Comportement Actuel
- ✅ Les tuiles de carte s'affichent correctement
- ✅ Le marqueur est visible et fonctionnel
- ❌ Le message "Erreur d'authentification" reste affiché par-dessus

### Cause Racine
Le listener `on("error")` capture une erreur mineure (peut-être une police ou une icône) au début du chargement, et le state `mapError` n'est jamais réinitialisé une fois que les tuiles sont chargées avec succès.

## Solution

### Modification 1 : Effacer l'erreur quand les tuiles sont chargées

Dans l'événement `idle` (qui indique que toutes les tuiles sont chargées), réinitialiser `mapError` à `null` :

```typescript
map.current.on("idle", () => {
  setTilesLoading(false);
  // Si les tuiles sont chargées avec succès, effacer les erreurs mineures
  setMapError(null);
});
```

### Modification 2 : Ne pas afficher l'erreur si les tuiles sont chargées

Ajouter une condition dans le JSX pour masquer le message d'erreur quand `tilesLoading` est false (c'est-à-dire que les tuiles ont été chargées avec succès) :

```typescript
{/* Map error overlay - only show if tiles haven't loaded */}
{mapError && tilesLoading && (
  <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg">
    ...
  </div>
)}
```

### Modification 3 : Filtrer les erreurs non-critiques

Améliorer le listener d'erreurs pour ignorer les erreurs mineures (polices, sprites) qui n'empêchent pas l'affichage de la carte :

```typescript
map.current.on("error", (e) => {
  console.error("Mapbox error:", e.error);
  const error = e.error as { status?: number; message?: string; url?: string };
  
  // Ignorer les erreurs mineures (polices, icônes, sprites)
  if (error?.url && (
    error.url.includes('fonts') ||
    error.url.includes('sprite') ||
    error.url.includes('glyphs')
  )) {
    console.warn("Non-critical Mapbox resource error:", error.url);
    return;
  }
  
  // Afficher uniquement les erreurs critiques (token, style)
  if (error?.status === 401 || error?.status === 403) {
    setMapError("Erreur d'authentification - token invalide ou domaine non autorisé");
  }
});
```

## Fichier à Modifier

| Fichier | Ligne | Modification |
|---------|-------|-------------|
| `src/components/LocationPicker.tsx` | 157-165 | Filtrer les erreurs non-critiques |
| `src/components/LocationPicker.tsx` | 181-183 | Effacer mapError dans l'événement idle |
| `src/components/LocationPicker.tsx` | 331 | Conditionner l'affichage de l'erreur |

## Résultat Attendu

Après ces modifications :
- Les erreurs mineures (polices/sprites) seront ignorées
- L'erreur sera automatiquement effacée si les tuiles se chargent avec succès
- Le message d'erreur ne s'affichera que si la carte est réellement cassée
- L'expérience utilisateur sera fluide sans messages d'erreur intempestifs

