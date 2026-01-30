

# Centraliser la Configuration Mapbox

## Token Configuré ✅

Votre nouveau token sécurisé avec restrictions URL est prêt :

| Élément | Valeur |
|---------|--------|
| Nom | JOIE DE VIVRE Production |
| Token | `pk.eyJ1IjoiamR2IiwiYSI6ImNtbDB1bm5iZDAwdXgzZHNhMmdkMmU2aHIifQ.vjA42a2nsRAs2Y6rg1Eisg` |
| Restrictions | 2 URLs (`*.lovable.app`, `pixl-parade-page.lovable.app`) |

## Problème Actuel

| Composant | Source du Token | Clé localStorage |
|-----------|-----------------|------------------|
| `CityMapSection.tsx` | **Hardcodé** (ancien token) | ❌ Aucune |
| `LocationPicker.tsx` | localStorage | `joie_de_vivre_mapbox_token` |
| `VendorLocationMap.tsx` | localStorage | `joie_de_vivre_mapbox_token` |
| `RealtimeMapCard.tsx` | localStorage | `joie_de_vivre_mapbox_token` |
| `BusinessClusterMap.tsx` | localStorage | `mapbox_token` (différent!) |

## Solution

Créer un **hook centralisé** et un **utilitaire de configuration** avec le nouveau token sécurisé.

## Architecture Cible

```text
┌─────────────────────────────────────────────────────────┐
│                 mapboxConfig.ts                          │
│  - MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token"      │
│  - DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoiamR2IiwiYSI..."   │
│  - Configuration par défaut (centre, zoom, style)        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  useMapboxToken()                        │
│  - Lit le token depuis localStorage                      │
│  - Migration automatique de l'ancienne clé               │
│  - Expose: token, isConfigured, setToken, clearToken     │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    LocationPicker   VendorLocationMap  RealtimeMap
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                  BusinessClusterMap
                           │
                           ▼
                   CityMapSection
```

## Fichiers à Créer

### 1. `src/utils/mapboxConfig.ts` (NOUVEAU)

Centralise les constantes avec le nouveau token sécurisé :

```typescript
// Clé unique pour le stockage localStorage
export const MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token";

// Token par défaut sécurisé (restreint à *.lovable.app)
export const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoiamR2IiwiYSI6ImNtbDB1bm5iZDAwdXgzZHNhMmdkMmU2aHIifQ.vjA42a2nsRAs2Y6rg1Eisg";

// Configuration par défaut de la carte
export const MAPBOX_DEFAULT_CENTER = {
  lat: 5.3364,  // Abidjan
  lng: -4.0267
};

export const MAPBOX_DEFAULT_ZOOM = 12;
export const MAPBOX_DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";
```

### 2. `src/hooks/useMapboxToken.ts` (NOUVEAU)

Hook React pour gérer le token de manière centralisée :

```typescript
import { useState, useEffect, useCallback } from "react";
import { MAPBOX_TOKEN_KEY, DEFAULT_MAPBOX_TOKEN } from "@/utils/mapboxConfig";

interface UseMapboxTokenOptions {
  useDefault?: boolean;
}

interface UseMapboxTokenResult {
  token: string | null;
  isConfigured: boolean;
  isUsingDefault: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export function useMapboxToken(
  options: UseMapboxTokenOptions = {}
): UseMapboxTokenResult {
  const { useDefault = true } = options;
  
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MAPBOX_TOKEN_KEY);
    setStoredToken(saved);
    
    // Migration: récupérer l'ancien token de BusinessClusterMap
    const oldToken = localStorage.getItem('mapbox_token');
    if (oldToken && !saved) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, oldToken);
      localStorage.removeItem('mapbox_token');
      setStoredToken(oldToken);
    }
  }, []);

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(MAPBOX_TOKEN_KEY, newToken);
    setStoredToken(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
    setStoredToken(null);
  }, []);

  const effectiveToken = storedToken || (useDefault ? DEFAULT_MAPBOX_TOKEN : null);
  
  return {
    token: effectiveToken,
    isConfigured: !!storedToken,
    isUsingDefault: !storedToken && useDefault,
    setToken,
    clearToken,
  };
}
```

## Fichiers à Modifier

### 3. `LocationPicker.tsx`

**Changements :**
- Supprimer `const MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token";` (ligne 22)
- Supprimer le `useEffect` pour charger le token (lignes 43-49)
- Importer `useMapboxToken` depuis le hook
- Utiliser `const { token: mapboxToken } = useMapboxToken();`

### 4. `VendorLocationMap.tsx`

**Changements :**
- Supprimer `const MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token";` (ligne 16)
- Supprimer le `useEffect` pour charger le token (lignes 28-33)
- Importer et utiliser `useMapboxToken({ useDefault: true })`

### 5. `BusinessClusterMap.tsx`

**Changements :**
- Supprimer le `useEffect` avec `mapbox_token` (lignes 43-46)
- Importer et utiliser `useMapboxToken({ useDefault: true })`
- Le hook migrera automatiquement l'ancien token

### 6. `CityMapSection.tsx`

**Changements :**
- **Supprimer le token hardcodé** (ligne 9)
- Importer `useMapboxToken` et `DEFAULT_MAPBOX_TOKEN`
- Utiliser `const { token } = useMapboxToken({ useDefault: true });`
- Remplacer `MAPBOX_TOKEN` par `token` dans l'initialisation

### 7. `RealtimeMapCard.tsx`

**Changements :**
- Supprimer `const MAPBOX_TOKEN_KEY` et la gestion locale du token
- Utiliser `useMapboxToken({ useDefault: false })` (admin doit configurer)
- Utiliser `setToken` et `clearToken` du hook

### 8. `RealtimeMap.tsx`

**Changements :**
- Simplifier les props (le parent gère la logique via le hook)
- Garder uniquement `mapboxToken` comme prop obligatoire

## Stratégie du Token par Défaut

| Composant | `useDefault` | Raison |
|-----------|--------------|--------|
| `CityMapSection` | `true` | Page publique `/villes` |
| `VendorLocationMap` | `true` | Page publique boutiques |
| `LocationPicker` | `true` | Création de boutique |
| `BusinessClusterMap` | `true` | Page `/explore` publique |
| `RealtimeMapCard` | `false` | Admin uniquement, peut demander le token |

## Détails Techniques

### Migration Automatique

Le hook détecte et migre automatiquement l'ancien token :

```text
┌─────────────────────────────────────┐
│ Premier chargement du hook          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ localStorage.getItem(MAPBOX_TOKEN_KEY) │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────────────┐
│ Token trouvé │  │ Pas de token             │
│ → Utiliser   │  │ → Chercher 'mapbox_token'│
└──────────────┘  └──────────┬───────────────┘
                             │
                     ┌───────┴───────┐
                     │               │
                     ▼               ▼
              ┌──────────────┐  ┌──────────────┐
              │ Ancien token │  │ Pas d'ancien │
              │ → Migrer     │  │ → Utiliser   │
              │ → Supprimer  │  │   DEFAULT    │
              │   ancienne   │  └──────────────┘
              │   clé        │
              └──────────────┘
```

### Récapitulatif des Modifications

| Fichier | Action | Lignes modifiées |
|---------|--------|------------------|
| `src/utils/mapboxConfig.ts` | **Créer** | Nouveau fichier (~15 lignes) |
| `src/hooks/useMapboxToken.ts` | **Créer** | Nouveau fichier (~45 lignes) |
| `src/components/LocationPicker.tsx` | Modifier | Lignes 22, 38, 43-49 |
| `src/components/VendorLocationMap.tsx` | Modifier | Lignes 16, 25, 28-33 |
| `src/components/BusinessClusterMap.tsx` | Modifier | Lignes 39, 43-46 |
| `src/components/city/CityMapSection.tsx` | Modifier | Ligne 9 (supprimer hardcode) |
| `src/components/admin/RealtimeMapCard.tsx` | Modifier | Lignes 17, 19-28 |
| `src/components/admin/RealtimeMap.tsx` | Modifier | Props simplifiées |

## Avantages

1. **Token sécurisé** - Nouveau token avec restrictions URL actives
2. **Source unique de vérité** - Un seul hook, une seule clé localStorage
3. **Migration transparente** - Les anciens tokens sont automatiquement migrés
4. **Token par défaut** - Les fonctionnalités publiques marchent sans configuration
5. **Facile à maintenir** - Pour changer le token, un seul endroit
6. **Suppression du hardcode** - Plus d'ancien token dans le code source

## Tests Recommandés

Après implémentation, vérifier :
- [ ] La carte s'affiche sur `/villes` (CityMapSection)
- [ ] La carte s'affiche sur `/explore` (BusinessClusterMap)
- [ ] LocationPicker fonctionne dans AddBusinessModal
- [ ] VendorLocationMap fonctionne sur les pages boutiques
- [ ] RealtimeMap demande le token dans l'admin si non configuré
- [ ] La migration de l'ancien token fonctionne

