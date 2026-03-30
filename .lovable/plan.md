

# Plan : Corriger le lien fill-friend-info dans AddFriendModal

## Probleme

Dans `src/components/AddFriendModal.tsx` (ligne 117), le lien est genere avec `window.location.origin` au lieu de `getAppBaseUrl()`. Cela produit des liens pointant vers le domaine Lovable preview au lieu de `joiedevivre-africa.com`.

`OnboardingExperience.tsx` utilise deja correctement `getAppBaseUrl()`.

## Modification

| Fichier | Action |
|---------|--------|
| `src/components/AddFriendModal.tsx` | Remplacer `window.location.origin` par `getAppBaseUrl()` (ligne 117) et ajouter l'import de `getAppBaseUrl` |

### Detail

```typescript
// Avant
const link = `${window.location.origin}/fill-friend-info/${data.token}`;

// Apres
const link = `${getAppBaseUrl()}/fill-friend-info/${data.token}`;
```

Ajouter en haut du fichier :
```typescript
import { getAppBaseUrl } from '@/utils/appUrl';
```

