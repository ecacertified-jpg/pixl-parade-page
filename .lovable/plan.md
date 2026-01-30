
# Corriger la Synchronisation du Token dans RealtimeMap

## Problème Identifié

Le composant `RealtimeMap.tsx` a un bug de synchronisation d'état :

```typescript
// Ligne 21 - État initial basé sur mapboxToken au premier rendu
const [hasValidToken, setHasValidToken] = useState(!!mapboxToken);

// Ligne 107 - Condition qui affiche le formulaire
if (!mapboxToken || !hasValidToken) {
  return (/* formulaire de saisie */);
}
```

### Chronologie du Bug

```text
┌────────────────────────────────────────────────────────┐
│ 1. Premier rendu                                        │
│    - useMapboxToken pas encore initialisé               │
│    - mapboxToken = null                                 │
│    - hasValidToken = false (useState initial)           │
│    → Affiche le formulaire ❌                           │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Hook initialisé                                      │
│    - mapboxToken = "pk.eyJ1Ijo..."                     │
│    - hasValidToken = false (pas mis à jour!)           │
│    → Condition (!mapboxToken || !hasValidToken)        │
│    → false || true = true → Affiche toujours           │
│      le formulaire ❌                                   │
└────────────────────────────────────────────────────────┘
```

## Solution

Modifier `RealtimeMap.tsx` pour synchroniser `hasValidToken` quand `mapboxToken` change :

### Modification 1 : Ajouter un useEffect de synchronisation

Ajouter un `useEffect` après la déclaration de `hasValidToken` pour le synchroniser :

```typescript
// Synchroniser hasValidToken quand mapboxToken change
useEffect(() => {
  if (mapboxToken) {
    setHasValidToken(true);
  }
}, [mapboxToken]);
```

### Modification 2 : Simplifier la condition de rendu

La condition ligne 107 peut aussi être simplifiée. Au lieu de :

```typescript
if (!mapboxToken || !hasValidToken) {
```

On peut utiliser :

```typescript
if (!mapboxToken) {
```

Et garder `hasValidToken` uniquement pour gérer les erreurs de validation du token (quand Mapbox rejette un token invalide).

## Fichier à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/RealtimeMap.tsx` | Ajouter useEffect de synchronisation après ligne 21 |

## Code Final

```typescript
// Ligne 20-28 après modification
const [tokenInput, setTokenInput] = useState('');
const [hasValidToken, setHasValidToken] = useState(!!mapboxToken);

// Synchroniser hasValidToken quand mapboxToken devient disponible
useEffect(() => {
  if (mapboxToken) {
    setHasValidToken(true);
  }
}, [mapboxToken]);

// Initialize map (useEffect existant)
useEffect(() => {
  // ...
```

## Résultat Attendu

Après cette modification :
- ✅ La carte s'affichera immédiatement quand le hook est initialisé
- ✅ `hasValidToken` sera mis à `true` dès que `mapboxToken` est disponible
- ✅ Les erreurs de token invalide seront toujours gérées (événement `error` de Mapbox)
