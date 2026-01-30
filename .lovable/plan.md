
# Activer le Token par Défaut pour la Carte Admin

## Problème Identifié

Dans `RealtimeMapCard.tsx` ligne 19, le hook est configuré avec `useDefault: false` :

```typescript
// Admin dashboard: useDefault=false to require explicit token configuration
const { token: mapboxToken, setToken, clearToken } = useMapboxToken({ useDefault: false });
```

Cela signifie que la carte admin **ne reçoit pas le token par défaut** et affiche donc le formulaire de saisie.

## Solution

Changer `useDefault: false` → `useDefault: true` pour que la carte admin utilise automatiquement le token sécurisé configuré dans `mapboxConfig.ts`.

## Modification

| Fichier | Ligne | Avant | Après |
|---------|-------|-------|-------|
| `src/components/admin/RealtimeMapCard.tsx` | 19 | `useDefault: false` | `useDefault: true` |

## Code Modifié

```typescript
// Ligne 18-19 : Utiliser le token par défaut pour l'admin aussi
const { token: mapboxToken, setToken, clearToken } = useMapboxToken({ useDefault: true });
```

## Optionnel : Supprimer le Bouton Reset

Puisque le token par défaut sera toujours disponible, le bouton "Réinitialiser" (lignes 34-38) devient moins utile. On peut le conserver pour permettre aux admins de tester avec un token personnalisé, ou le supprimer pour simplifier l'interface.

## Résultat Attendu

Après cette modification :
- ✅ La carte s'affichera immédiatement sur `/admin/realtime`
- ✅ Le token `pk.eyJ1IjoiamR2...` sera utilisé automatiquement
- ✅ Cohérence avec toutes les autres cartes du projet
